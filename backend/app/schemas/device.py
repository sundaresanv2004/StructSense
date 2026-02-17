from pydantic import BaseModel, ConfigDict
from datetime import datetime

class DeviceBase(BaseModel):
    name: str
    type: str
    building_name: str | None = None
    location_description: str | None = None

class DeviceRegister(DeviceBase):
    """Schema for registering a new device"""
    device_uid: str
    
    # Threshold percentages for alerts
    tilt_threshold_percent: float = 50.0
    distance_threshold_percent: float = 50.0
    
    # Email for notifications
    notification_email: str | None = None
    
    installed_at: datetime | None = None

class DeviceUpdate(BaseModel):
    """Schema for updating device information"""
    name: str | None = None
    type: str | None = None
    building_name: str | None = None
    location_description: str | None = None
    tilt_threshold_percent: float | None = None
    distance_threshold_percent: float | None = None
    notification_email: str | None = None

class DeviceResponse(DeviceBase):
    """Schema for device response"""
    id: int
    device_uid: str
    tilt_threshold_percent: float
    distance_threshold_percent: float
    notification_email: str | None
    installed_at: datetime
    connection_status: bool
    last_seen_at: datetime | None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
