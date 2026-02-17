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
            distance_mm=sensor_data.distance_mm,
            created_at=datetime.now(timezone.utc)
        )
        db.add(raw_reading)
        await db.flush() # Flush to get the ID
        
        # 2. Get Baseline
        
        # If this is the very first reading, it is the baseline itself
        # In that case, initial_reading might be the one we just added (or None if not committed yet? flush handles it)
        # Actually effectively if it's the first reading, diffs are 0.
        
        # Calculate baselines (first reading ever for this device?)
        # For now, we use the VERY FIRST reading as baseline.
        # Check if we have a baseline reading
        base_tilt_x = raw_reading.tilt_x
        base_tilt_y = raw_reading.tilt_y
        base_tilt_z = raw_reading.tilt_z
        base_distance = raw_reading.distance_mm
        
        # optimized: could cache baseline in device record or redis
        # For now, simple query: get first reading
        first_reading = await SensorService.get_initial_reading(db, device.id)
        if first_reading:
            base_tilt_x = first_reading.tilt_x
            base_tilt_y = first_reading.tilt_y
            base_tilt_z = first_reading.tilt_z
            base_distance = first_reading.distance_mm
            
        # Calculate differences (absolute change)
        tilt_diff_x = raw_reading.tilt_x - base_tilt_x
        tilt_diff_y = raw_reading.tilt_y - base_tilt_y
        tilt_diff_z = raw_reading.tilt_z - base_tilt_z
        distance_diff_mm = raw_reading.distance_mm - base_distance
        
        # Calculate percentage change for each axis individually
        # If baseline is 0, any deviation is considered 100% change
        def calc_pct_change(current, baseline):
            if baseline == 0:
                return 100.0 if current != 0 else 0.0
            return abs((current - baseline) / baseline) * 100.0

        pct_x = calc_pct_change(raw_reading.tilt_x, base_tilt_x)
        pct_y = calc_pct_change(raw_reading.tilt_y, base_tilt_y)
        pct_z = calc_pct_change(raw_reading.tilt_z, base_tilt_z)
        
        # Use the MAXIMUM change among all axes to trigger alerts if ANY axis goes wide
        tilt_change_percent = max(pct_x, pct_y, pct_z)
            
        if base_distance == 0:
            distance_change_percent = 100.0 if raw_reading.distance_mm != 0 else 0.0
        else:
            distance_change_percent = abs(((raw_reading.distance_mm - base_distance) / base_distance) * 100)
            
        status = SensorService.determine_status(device, tilt_change_percent, distance_change_percent)
        
        processed_reading = ProcessedSensorData(
            device_id=device.id,
            raw_data_id=raw_reading.id,
            tilt_diff_x=abs(tilt_diff_x),
            tilt_diff_y=abs(tilt_diff_y),
            tilt_diff_z=abs(tilt_diff_z),
            distance_diff_mm=abs(distance_diff_mm),
            tilt_change_percent=tilt_change_percent,
            distance_change_percent=distance_change_percent,
            status=status,
            created_at=raw_reading.created_at # sync timestamp
        )
        db.add(processed_reading)
        
        # 5. Update Device Status
        device.connection_status = True
        device.last_seen_at = datetime.now(timezone.utc)
        
        await db.commit()
        await db.refresh(processed_reading)
        
        return processed_reading
