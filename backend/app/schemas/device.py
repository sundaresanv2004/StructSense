from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class DeviceBase(BaseModel):
    device_uid: str
    name: str
    type: str
    building_name: Optional[str] = None
    location_description: Optional[str] = None
    baseline_distance_cm: float

class DeviceRegister(DeviceBase):
    """Schema for registering a new device"""
    installed_at: Optional[datetime] = None

class DeviceUpdate(BaseModel):
    """Schema for updating device information"""
    name: Optional[str] = None
    building_name: Optional[str] = None
    location_description: Optional[str] = None
    baseline_distance_cm: Optional[float] = None

class DeviceResponse(DeviceBase):
    """Schema for device response"""
    id: int
    connection_status: bool
    installed_at: Optional[datetime] = None
    last_seen_at: Optional[datetime] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
