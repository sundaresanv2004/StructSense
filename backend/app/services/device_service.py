from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.device import Device
from app.schemas.device import DeviceRegister, DeviceUpdate
from datetime import datetime, timezone
from fastapi import HTTPException, status

class DeviceService:
    """Service layer for device operations"""
    
    @staticmethod
    async def register_device(db: AsyncSession, device_data: DeviceRegister) -> Device:
        """
        Register a new ESP32 device in the system.
        
        Args:
            db: Database session
            device_data: Device registration data with thresholds
            
        Returns:
            Created Device instance
            
        Raises:
            HTTPException: If device_uid already exists
        """
        # Check if device already exists
        existing_device = await DeviceService.get_device_by_uid(db, device_data.device_uid)
        if existing_device:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Device with UID '{device_data.device_uid}' already exists"
            )
        
        # Create new device with thresholds
        device = Device(
            device_uid=device_data.device_uid,
            name=device_data.name,
            type=device_data.type,
            building_name=device_data.building_name,
            location_description=device_data.location_description,
            tilt_warning_threshold=device_data.tilt_warning_threshold,
            tilt_alert_threshold=device_data.tilt_alert_threshold,
            distance_warning_threshold=device_data.distance_warning_threshold,
            distance_alert_threshold=device_data.distance_alert_threshold,
            notification_email=device_data.notification_email,
            installed_at=device_data.installed_at or datetime.now(timezone.utc),
            connection_status=False,
            created_at=datetime.now(timezone.utc)
        )
        
        db.add(device)
        await db.commit()
        await db.refresh(device)
        
        return device
    
    @staticmethod
    async def get_all_devices(db: AsyncSession) -> list[Device]:
        """
        Retrieve all registered devices.
        
        Args:
            db: Database session
            
        Returns:
            List of all Device instances
        """
        result = await db.execute(select(Device).order_by(Device.created_at.desc()))
        devices = result.scalars().all()
        return list(devices)
    
    @staticmethod
    async def get_device_by_uid(db: AsyncSession, device_uid: str) -> Device | None:
        """
        Get a device by its unique device_uid.
        
        Args:
            db: Database session
            device_uid: Unique device identifier
            
        Returns:
            Device instance or None if not found
        """
        result = await db.execute(
            select(Device).where(Device.device_uid == device_uid)
        )
        return result.scalars().first()
    
    @staticmethod
    async def get_device_by_id(db: AsyncSession, device_id: int) -> Device | None:
        """
        Get a device by its database ID.
        
        Args:
            db: Database session
            device_id: Device ID
            
        Returns:
            Device instance or None if not found
        """
        result = await db.execute(
            select(Device).where(Device.id == device_id)
        )
        return result.scalars().first()
    
    @staticmethod
    async def update_device(
        db: AsyncSession,
        device_id: int,
        device_data: DeviceUpdate
    ) -> Device:
        """
        Update device details (excluding device_uid and type).
        
        Args:
            db: Database session
            device_id: Device ID to update
            device_data: Updated device data
            
        Returns:
            Updated Device instance
            
        Raises:
            HTTPException: If device not found
        """
        device = await DeviceService.get_device_by_id(db, device_id)
        
        if not device:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Device with ID {device_id} not found"
            )
        
        # Update only allowed fields
        update_data = device_data.model_dump(exclude_unset=True)
        
        for field, value in update_data.items():
            setattr(device, field, value)
        
        await db.commit()
        await db.refresh(device)
        
        return device
    
    @staticmethod
    async def update_device_connection(
        db: AsyncSession,
        device: Device,
        status: bool
    ) -> None:
        """
        Update device connection status and last seen timestamp.
        
        Args:
            db: Database session
            device: Device instance to update
            status: Connection status (True for online, False for offline)
        """
        device.connection_status = status
        device.last_seen_at = datetime.now(timezone.utc)
        await db.commit()
