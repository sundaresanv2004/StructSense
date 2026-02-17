from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.schemas.device import DeviceRegister, DeviceResponse
from app.services.device_service import DeviceService

router = APIRouter()

@router.post("/register", response_model=DeviceResponse, status_code=status.HTTP_201_CREATED)
async def register_device(
    device_data: DeviceRegister,
    db: AsyncSession = Depends(get_db)
):
    """
    Register a new ESP32 device in the system.
    
    The device must be registered before it can send sensor data.
    Each device requires a unique device_uid.
    
    Args:
        device_data: Device registration information
        db: Database session
        
    Returns:
        Created device details
        
    Raises:
        HTTPException 400: If device_uid already exists
    """
    device = await DeviceService.register_device(db, device_data)
    return device


@router.get("", response_model=List[DeviceResponse])
async def list_devices(
    db: AsyncSession = Depends(get_db)
):
    """
    List all registered ESP32 devices.
    
    Returns:
        List of all devices in the system
    """
    devices = await DeviceService.get_all_devices(db)
    return devices


@router.get("/{device_id}", response_model=DeviceResponse)
async def get_device(
    device_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Get details of a specific device by ID.
    """
    device = await DeviceService.get_device_by_id(db, device_id)
    
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Device with ID {device_id} not found"
        )
    
    return device
