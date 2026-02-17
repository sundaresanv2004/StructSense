from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.sensor_reading import SensorReading
from app.models.device import Device
from app.schemas.sensor import SensorIngestRequest
from datetime import datetime, timezone
import math

class SensorService:
    """
    Service for processing ESP32 sensor data with threshold-based monitoring.
    
    This service implements percentage change detection from the initial reading,
    replacing the fixed baseline distance approach.
    """
    
    @staticmethod
    async def get_initial_reading(db: AsyncSession, device_id: int) -> SensorReading | None:
        """
        Get the first sensor reading for a device (used as baseline).
        
        Args:
            db: Database session
            device_id: Device ID
            
        Returns:
            First SensorReading or None if no readings exist
        """
        result = await db.execute(
            select(SensorReading)
            .where(SensorReading.device_id == device_id)
            .order_by(SensorReading.created_at.asc())
            .limit(1)
        )
        return result.scalars().first()
    
    @staticmethod
    def calculate_tilt_angle(tilt_x: float, tilt_y: float, tilt_z: float) -> float:
        """
        Calculate total tilt angle in degrees from accelerometer readings.
        
        Args:
            tilt_x: X-axis tilt
            tilt_y: Y-axis tilt
            tilt_z: Z-axis tilt
            
        Returns:
            Total tilt angle in degrees
        """
        return math.sqrt(tilt_x**2 + tilt_y**2 + tilt_z**2)
    
    @staticmethod
    def calculate_tilt_change_percent(initial_angle: float, current_angle: float) -> float:
        """
        Calculate percentage change in tilt angle from initial reading.
        
        Args:
            initial_angle: Tilt angle from first reading
            current_angle: Current tilt angle
            
        Returns:
            Percentage change (absolute value)
        """
        if initial_angle == 0:
            return 0.0 if current_angle == 0 else 100.0
        return abs(((current_angle - initial_angle) / initial_angle) * 100)
    
    @staticmethod
    def calculate_distance_change_percent(initial_distance: float, current_distance: float) -> float:
        """
        Calculate percentage change in distance from initial reading.
        
        Args:
            initial_distance: Distance from first reading
            current_distance: Current distance
            
        Returns:
            Percentage change (absolute value)
        """
        if initial_distance == 0:
            return 0.0 if current_distance == 0 else 100.0
        return abs(((current_distance - initial_distance) / initial_distance) * 100)
    
    @staticmethod
    def check_thresholds(
        device: Device,
        tilt_change_percent: float,
        distance_change_percent: float
    ) -> tuple[bool, bool]:
        """
        Check if percentage changes exceed device thresholds.
        
        Args:
            device: Device with threshold settings
            tilt_change_percent: Calculated tilt change percentage
            distance_change_percent: Calculated distance change percentage
            
        Returns:
            Tuple of (tilt_breached, distance_breached)
        """
        tilt_breached = tilt_change_percent > device.tilt_threshold_percent
        distance_breached = distance_change_percent > device.distance_threshold_percent
        return tilt_breached, distance_breached
    
    @staticmethod
    async def ingest_sensor_data(
        db: AsyncSession,
        device: Device,
        sensor_data: SensorIngestRequest
    ) -> SensorReading:
        """
        Process incoming sensor data with threshold monitoring.
        
        The first reading becomes the baseline. All subsequent readings are
        compared against this initial reading to calculate percentage changes.
        
        Args:
            db: Database session
            device: Device instance
            sensor_data: Sensor data from ESP32
            
        Returns:
            Created SensorReading instance
        """
        # Get initial reading (baseline)
        initial_reading = await SensorService.get_initial_reading(db, device.id)
        
        # Calculate current tilt angle
        current_tilt_angle = SensorService.calculate_tilt_angle(
            sensor_data.tilt_x, sensor_data.tilt_y, sensor_data.tilt_z
        )
        
        # If this is the first reading, set as baseline
        if initial_reading is None:
            reading = SensorReading(
                device_id=device.id,
                tilt_x=sensor_data.tilt_x,
                tilt_y=sensor_data.tilt_y,
                tilt_z=sensor_data.tilt_z,
                distance_cm=sensor_data.distance_cm,
                tilt_change_percent=0.0,
                distance_change_percent=0.0,
                tilt_threshold_breached=False,
                distance_threshold_breached=False,
                email_sent=False,
                created_at=datetime.now(timezone.utc)
            )
        else:
            # Calculate changes from initial reading
            initial_tilt_angle = SensorService.calculate_tilt_angle(
                initial_reading.tilt_x, initial_reading.tilt_y, initial_reading.tilt_z
            )
            
            tilt_change_percent = SensorService.calculate_tilt_change_percent(
                initial_tilt_angle, current_tilt_angle
            )
            distance_change_percent = SensorService.calculate_distance_change_percent(
                initial_reading.distance_cm, sensor_data.distance_cm
            )
            
            # Check thresholds
            tilt_breached, distance_breached = SensorService.check_thresholds(
                device, tilt_change_percent, distance_change_percent
            )
            
            # Create reading
            reading = SensorReading(
                device_id=device.id,
                tilt_x=sensor_data.tilt_x,
                tilt_y=sensor_data.tilt_y,
                tilt_z=sensor_data.tilt_z,
                distance_cm=sensor_data.distance_cm,
                tilt_change_percent=tilt_change_percent,
                distance_change_percent=distance_change_percent,
                tilt_threshold_breached=tilt_breached,
                distance_threshold_breached=distance_breached,
                email_sent=False,
                created_at=datetime.now(timezone.utc)
            )
            
            # TODO: Send email if threshold breached and notification_email is set
            # if (tilt_breached or distance_breached) and device.notification_email:
            #     await EmailService.send_threshold_alert(device, reading, tilt_breached, distance_breached)
            #     reading.email_sent = True
        
        db.add(reading)
        
        # Update device connection status
        device.connection_status = True
        device.last_seen_at = datetime.now(timezone.utc)
        
        await db.commit()
        await db.refresh(reading)
        
        return reading
