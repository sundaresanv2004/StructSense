from datetime import datetime, timezone
import math
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.models.device import Device
from app.models.sensor_reading import SensorReading
from app.schemas.sensor import SensorIngestRequest


class SensorService:
    """Service layer for sensor data ingestion and processing"""
    
    # Tilt status thresholds (in degrees)
    TILT_SAFE_THRESHOLD = 2.0
    TILT_WARNING_THRESHOLD = 5.0
    TILT_RISK_THRESHOLD = 10.0
    
    @staticmethod
    def calculate_settlement(baseline_distance_cm: float, measured_distance_cm: float) -> float:
        """
        Calculate settlement based on baseline and measured distance.
        
        Settlement = baseline_distance_cm - measured_distance_cm
        
        Positive settlement indicates the structure has settled (distance increased).
        Negative settlement indicates upward movement (distance decreased).
        
        Args:
            baseline_distance_cm: Baseline distance when device was installed
            measured_distance_cm: Current measured distance
            
        Returns:
            Settlement in centimeters
        """
        return baseline_distance_cm - measured_distance_cm
    
    @staticmethod
    def calculate_tilt_angle(tilt_x: float, tilt_y: float, tilt_z: float) -> float:
        """
        Calculate total tilt angle from accelerometer readings.
        
        Uses 3D vector magnitude to determine overall tilt from vertical.
        Assumes tilt_z represents vertical axis (gravity ~9.8 m/s²).
        
        Args:
            tilt_x: X-axis tilt value
            tilt_y: Y-axis tilt value
            tilt_z: Z-axis tilt value
            
        Returns:
            Tilt angle in degrees
        """
        # Calculate the magnitude of tilt vector
        tilt_magnitude = math.sqrt(tilt_x**2 + tilt_y**2)
        
        # Calculate angle from vertical (Z-axis)
        # Using arctan to get angle in radians, then convert to degrees
        if tilt_z != 0:
            tilt_angle_rad = math.atan2(tilt_magnitude, abs(tilt_z))
            tilt_angle_deg = math.degrees(tilt_angle_rad)
        else:
            # If z is 0, assume maximum tilt (90 degrees)
            tilt_angle_deg = 90.0
        
        return tilt_angle_deg
    
    @staticmethod
    def evaluate_tilt_status(tilt_angle: float) -> str:
        """
        Evaluate tilt status based on calculated tilt angle.
        
        Thresholds:
        - SAFE: < 2 degrees
        - WARNING: 2-5 degrees
        - RISK: 5-10 degrees
        - DANGER: > 10 degrees
        
        Args:
            tilt_angle: Tilt angle in degrees
            
        Returns:
            Tilt status string (SAFE, WARNING, RISK, DANGER)
        """
        if tilt_angle < SensorService.TILT_SAFE_THRESHOLD:
            return "SAFE"
        elif tilt_angle < SensorService.TILT_WARNING_THRESHOLD:
            return "WARNING"
        elif tilt_angle < SensorService.TILT_RISK_THRESHOLD:
            return "RISK"
        else:
            return "DANGER"
    
    @staticmethod
    async def ingest_sensor_data(
        db: AsyncSession,
        device: Device,
        sensor_data: SensorIngestRequest
    ) -> SensorReading:
        """
        Process and store sensor reading from ESP32 device.
        
        Steps:
        1. Calculate settlement from baseline
        2. Calculate tilt angle from accelerometer data
        3. Evaluate tilt status
        4. Create sensor reading record
        5. Update device connection status
        
        Args:
            db: Database session
            device: Device object (already validated)
            sensor_data: Sensor data from ESP32
            
        Returns:
            Created sensor reading
        """
        # Calculate settlement
        settlement_cm = SensorService.calculate_settlement(
            device.baseline_distance_cm,
            sensor_data.distance_cm
        )
        
        # Calculate tilt angle
        tilt_angle = SensorService.calculate_tilt_angle(
            sensor_data.tilt_x,
            sensor_data.tilt_y,
            sensor_data.tilt_z
        )
        
        # Evaluate tilt status
        tilt_status = SensorService.evaluate_tilt_status(tilt_angle)
        
        # Create sensor reading
        reading = SensorReading(
            device_id=device.id,
            tilt_x=sensor_data.tilt_x,
            tilt_y=sensor_data.tilt_y,
            tilt_z=sensor_data.tilt_z,
            distance_cm=sensor_data.distance_cm,
            settlement_cm=settlement_cm,
            tilt_status=tilt_status,
            created_at=datetime.now(timezone.utc)
        )
        
        db.add(reading)
        
        # Update device connection status and last_seen
        device.connection_status = True
        device.last_seen_at = datetime.now(timezone.utc)
        
        await db.commit()
        await db.refresh(reading)
        
        return reading
