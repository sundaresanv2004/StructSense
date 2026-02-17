from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.schemas.device import DeviceRegister, DeviceResponse, DeviceUpdate
from app.services.device_service import DeviceService

router = APIRouter()

@router.post("/", response_model=DeviceResponse, status_code=status.HTTP_201_CREATED)
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


@router.patch("/{device_id}", response_model=DeviceResponse)
async def update_device(
    device_id: int,
    device_data: DeviceUpdate,
    db: AsyncSession = Depends(get_db)
):
    """
    Update device details (name, location, thresholds, email).
    
    Cannot update device_uid or type for data integrity.
    
    Args:
        device_id: Device ID to update
        device_data: Fields to update
        db: Database session
        
    Returns:
        Updated device details
        
    Raises:
        HTTPException 404: If device not found
    """
    device = await DeviceService.update_device(db, device_id, device_data)
    return device


@router.delete("/{device_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_device(
    device_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a device and all its data.
    """
    success = await DeviceService.delete_device(db, device_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Device with ID {device_id} not found"
        )
    return None


@router.post("/{device_id}/reset", status_code=status.HTTP_200_OK)
async def reset_device_data(
    device_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Reset all sensor data for a device (Raw and Processed).
    Keeps the device registration.
    """
    success = await DeviceService.reset_device_data(db, device_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Device with ID {device_id} not found"
        )
    return {"message": "Device data reset successfully"}
