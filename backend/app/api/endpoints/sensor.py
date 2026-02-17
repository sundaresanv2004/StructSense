from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.core.db import get_db
from app.schemas.sensor import SensorIngestRequest, ProcessedSensorDataResponse
from app.models.processed_sensor_data import ProcessedSensorData
from app.services.device_service import DeviceService
from app.services.sensor_service import SensorService

router = APIRouter()

@router.post("/ingest", response_model=ProcessedSensorDataResponse, status_code=status.HTTP_201_CREATED)
async def ingest_sensor_data(
    sensor_data: SensorIngestRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Ingest sensor data from ESP32 device.
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

@router.get("/devices/{device_id}/processed", response_model=List[ProcessedSensorDataResponse])
async def get_processed_data(
    device_id: int,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """
    Get processed sensor data for a specific device.
    """
    result = await db.execute(
        select(ProcessedSensorData)
        .where(ProcessedSensorData.device_id == device_id)
        .order_by(ProcessedSensorData.created_at.desc())
        .limit(limit)
    )
    return result.scalars().all()
