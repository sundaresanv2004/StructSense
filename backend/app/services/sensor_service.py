from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.raw_sensor_data import RawSensorData
from app.models.processed_sensor_data import ProcessedSensorData
from app.models.device import Device
from app.schemas.sensor import SensorIngestRequest
from datetime import datetime, timezone
import math

class SensorService:
    """
    Service for processing ESP32 sensor data with threshold-based monitoring.
    
    This service implements:
    1. Splits data into Raw and Processed tables.
    2. Uses the first reading as a baseline.
    3. Calculates differences from baseline.
    4. Determines status (SAFE, WARNING, ALERT) based on device thresholds.
    """
    
    @staticmethod
    async def get_initial_reading(db: AsyncSession, device_id: int) -> RawSensorData | None:
        """Get the first raw sensor reading for a device (used as baseline)."""
        result = await db.execute(
            select(RawSensorData)
            .where(RawSensorData.device_id == device_id)
            .order_by(RawSensorData.created_at.asc())
            .limit(1)
        )
        return result.scalars().first()
    
    @staticmethod
    def calculate_tilt_angle(tilt_x: float, tilt_y: float, tilt_z: float) -> float:
        """Calculate total tilt angle in degrees."""
        return math.sqrt(tilt_x**2 + tilt_y**2 + tilt_z**2)
    
    @staticmethod
    def determine_status(
        device: Device,
        tilt_change: float,
        distance_change: float
    ) -> str:
        """
        Determine status (SAFE, WARNING, ALERT) based on thresholds.
        
        Logic:
        - ALERT if any metric > alert_threshold
        - WARNING if any metric > warning_threshold (and not ALERT)
        - SAFE otherwise
        """
        # Check Alert
        if (tilt_change > device.tilt_alert_threshold or 
            distance_change > device.distance_alert_threshold):
            return "ALERT"
            
        # Check Warning
        if (tilt_change > device.tilt_warning_threshold or 
            distance_change > device.distance_warning_threshold):
            return "WARNING"
            
        return "SAFE"
    
    @staticmethod
    async def ingest_sensor_data(
        db: AsyncSession,
        device: Device,
        sensor_data: SensorIngestRequest
    ) -> ProcessedSensorData:
        """
        Process incoming sensor data.
        
        1. Save RawSensorData.
        2. Calculate stats against baseline.
        3. Save ProcessedSensorData.
        4. Update device online status.
        """
        # 1. Save Raw Data
        raw_reading = RawSensorData(
            device_id=device.id,
            tilt_x=sensor_data.tilt_x,
            tilt_y=sensor_data.tilt_y,
            tilt_z=sensor_data.tilt_z,
            distance_cm=sensor_data.distance_cm,
            created_at=datetime.now(timezone.utc)
        )
        db.add(raw_reading)
        await db.flush() # Flush to get the ID
        
        # 2. Get Baseline
        initial_reading = await SensorService.get_initial_reading(db, device.id)
        
        # If this is the very first reading, it is the baseline itself
        # In that case, initial_reading might be the one we just added (or None if not committed yet? flush handles it)
        # Actually effectively if it's the first reading, diffs are 0.
        
        if not initial_reading or initial_reading.id == raw_reading.id:
            # This is the baseline
            base_tilt_x = raw_reading.tilt_x
            base_tilt_y = raw_reading.tilt_y
            base_tilt_z = raw_reading.tilt_z
            base_distance = raw_reading.distance_cm
            
            # Diffs are 0
            tilt_diff_x = 0.0
            tilt_diff_y = 0.0
            tilt_diff_z = 0.0
            distance_diff_cm = 0.0
            tilt_change_percent = 0.0
            distance_change_percent = 0.0
        else:
            # Compare against baseline
            base_tilt_x = initial_reading.tilt_x
            base_tilt_y = initial_reading.tilt_y
            base_tilt_z = initial_reading.tilt_z
            base_distance = initial_reading.distance_cm
            
            # Calculate raw diffs
            tilt_diff_x = raw_reading.tilt_x - base_tilt_x
            tilt_diff_y = raw_reading.tilt_y - base_tilt_y
            tilt_diff_z = raw_reading.tilt_z - base_tilt_z
            distance_diff_cm = raw_reading.distance_cm - base_distance
            
            # Calculate percentage/magnitude changes for thresholding
            # For tilt, we use the magnitude of the angular change vector or just change in total angle?
            # User mentioned "subtracting it from the original value... calculate the difference over time"
            # Let's use the magnitude of the difference vector for tilt change
            # Or difference in total angle.
            # Implementation Plan used "tilt_change_percent" previously.
            # Let's use % change of total angle magnitude for consistency with previous logic, 
            # OR simple magnitude of difference if angles are small.
            # Let's stick to % change of magnitude for now as it maps to "percent" thresholds in DB.
            
            initial_angle = SensorService.calculate_tilt_angle(base_tilt_x, base_tilt_y, base_tilt_z)
            current_angle = SensorService.calculate_tilt_angle(raw_reading.tilt_x, raw_reading.tilt_y, raw_reading.tilt_z)
            
            if initial_angle == 0:
                tilt_change_percent = 0.0 if current_angle == 0 else 100.0
            else:
                tilt_change_percent = abs(((current_angle - initial_angle) / initial_angle) * 100)
                
            if base_distance == 0:
                distance_change_percent = 0.0 if raw_reading.distance_cm == 0 else 100.0
            else:
                distance_change_percent = abs(((raw_reading.distance_cm - base_distance) / base_distance) * 100)

        # 3. Determine Status
        status = SensorService.determine_status(device, tilt_change_percent, distance_change_percent)
        
        # 4. Save Processed Data
        processed_reading = ProcessedSensorData(
            device_id=device.id,
            raw_data_id=raw_reading.id,
            tilt_diff_x=tilt_diff_x,
            tilt_diff_y=tilt_diff_y,
            tilt_diff_z=tilt_diff_z,
            distance_diff_cm=distance_diff_cm,
            tilt_change_percent=tilt_change_percent,
            distance_change_percent=distance_change_percent,
            status=status,
            created_at=raw_reading.created_at
        )
        db.add(processed_reading)
        
        # 5. Update Device Status
        device.connection_status = True
        device.last_seen_at = datetime.now(timezone.utc)
        
        await db.commit()
        await db.refresh(processed_reading)
        
        return processed_reading
