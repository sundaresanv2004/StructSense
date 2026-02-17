from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.schemas.sensor import SensorIngestRequest, SensorReadingResponse
from app.services.device_service import DeviceService
from app.services.sensor_service import SensorService

router = APIRouter()

@router.post("/ingest", response_model=SensorReadingResponse, status_code=status.HTTP_201_CREATED)
async def ingest_sensor_data(
    sensor_data: SensorIngestRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Ingest sensor data from ESP32 device.
    
    This endpoint receives telemetry data from ESP32 devices and:
    1. Validates that the device exists and is registered
    2. Calculates settlement based on baseline distance
    3. Calculates tilt angle from accelerometer data
    4. Evaluates tilt status (SAFE, WARNING, RISK, DANGER)
    5. Stores the sensor reading
    6. Updates device connection status
    
    Args:
        sensor_data: Sensor readings from ESP32
        db: Database session
        
    Returns:
        Created sensor reading with calculated values
        
    Raises:
        HTTPException 404: If device not found (unknown device_uid)
    """
    # Validate device exists
    device = await DeviceService.get_device_by_uid(db, sensor_data.device_uid)
    
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Device with UID '{sensor_data.device_uid}' not found. "
                   f"Device must be registered before sending data."
        )
    
    # Process and store sensor reading
    reading = await SensorService.ingest_sensor_data(db, device, sensor_data)
    
    return reading
