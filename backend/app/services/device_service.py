from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status

from app.models.device import Device
from app.schemas.device import DeviceRegister, DeviceUpdate


class DeviceService:
    """Service layer for device operations"""
    
    @staticmethod
    async def register_device(
        db: AsyncSession,
        device_data: DeviceRegister
    ) -> Device:
        """
        Register a new ESP32 device in the system.
        
        Args:
            db: Database session
            device_data: Device registration data
            
        Returns:
            Created device
            
        Raises:
            HTTPException: If device_uid already exists
        """
        # Check if device_uid already exists
        result = await db.execute(
            select(Device).where(Device.device_uid == device_data.device_uid)
        )
        existing_device = result.scalars().first()
        
        if existing_device:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Device with UID '{device_data.device_uid}' already exists"
            )
        
        # Create new device
        device = Device(
            device_uid=device_data.device_uid,
            name=device_data.name,
            type=device_data.type,
            building_name=device_data.building_name,
            location_description=device_data.location_description,
            baseline_distance_cm=device_data.baseline_distance_cm,
            installed_at=device_data.installed_at or datetime.now(timezone.utc),
            connection_status=False,
            created_at=datetime.now(timezone.utc)
        )
        
        db.add(device)
        await db.commit()
        await db.refresh(device)
        
        return device
    
    @staticmethod
    async def get_all_devices(db: AsyncSession) -> List[Device]:
        """
        Get all registered devices.
        
        Args:
            db: Database session
            
        Returns:
            List of all devices
        """
        result = await db.execute(select(Device).order_by(Device.created_at.desc()))
        devices = result.scalars().all()
        return list(devices)
    
    @staticmethod
    async def get_device_by_uid(db: AsyncSession, device_uid: str) -> Optional[Device]:
        """
        Get a device by its unique identifier.
        
        Args:
            db: Database session
            device_uid: Unique device identifier
            
        Returns:
            Device if found, None otherwise
        """
        result = await db.execute(
            select(Device).where(Device.device_uid == device_uid)
        )
        return result.scalars().first()
    
    @staticmethod
    async def get_device_by_id(db: AsyncSession, device_id: int) -> Optional[Device]:
        """
        Get a device by its ID.
        
        Args:
            db: Database session
            device_id: Device ID
            
        Returns:
            Device if found, None otherwise
        """
        result = await db.execute(
            select(Device).where(Device.id == device_id)
        )
        return result.scalars().first()
    
    @staticmethod
    async def update_device_connection(
        db: AsyncSession,
        device: Device,
        connected: bool
    ) -> Device:
        """
        Update device connection status and last_seen timestamp.
        
        Args:
            db: Database session
            device: Device to update
            connected: Connection status
            
        Returns:
            Updated device
        """
        device.connection_status = connected
        device.last_seen_at = datetime.now(timezone.utc)
        
        await db.commit()
        await db.refresh(device)
        
        return device
