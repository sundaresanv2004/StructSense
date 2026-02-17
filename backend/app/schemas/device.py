from pydantic import BaseModel, ConfigDict, Field, computed_field
from datetime import datetime, timezone, timedelta
from typing import Optional

class DeviceBase(BaseModel):
    name: str
    type: str
    building_name: str | None = None
    location_description: str | None = None

class DeviceRegister(DeviceBase):
    """Schema for registering a new device"""
    device_uid: str
    
    # Threshold percentages for alerts (3-State)
    tilt_warning_threshold: float = 30.0
    tilt_alert_threshold: float = 50.0
    
    distance_warning_threshold: float = 30.0
    distance_alert_threshold: float = 50.0
    
    # Email for notifications
    notification_email: str | None = None
    
    installed_at: datetime | None = None

class DeviceUpdate(BaseModel):
    """Schema for updating device information"""
    name: str | None = None
    type: str | None = None
    building_name: str | None = None
    location_description: str | None = None
    
    tilt_warning_threshold: float | None = None
    tilt_alert_threshold: float | None = None
    distance_warning_threshold: float | None = None
    distance_alert_threshold: float | None = None
    
    notification_email: str | None = None

class DeviceResponse(DeviceBase):
    """Schema for device response"""
    id: int
    device_uid: str
    
    tilt_warning_threshold: float
    tilt_alert_threshold: float
    distance_warning_threshold: float
    distance_alert_threshold: float
    
    notification_email: str | None
    installed_at: datetime
    connection_status: bool
    last_seen_at: datetime | None
    created_at: datetime
    
    @computed_field
    @property
    def is_online(self) -> bool:
        """
        Check if device is considered online (seen in last 5 minutes).
        Overrides the database connection_status which might be stale.
        """
        if not self.last_seen_at:
            return False
            
        # Ensure last_seen_at is timezone aware
        last_seen = self.last_seen_at
        if last_seen.tzinfo is None:
            last_seen = last_seen.replace(tzinfo=timezone.utc)
            
        now = datetime.now(timezone.utc)
        diff = now - last_seen
        return diff < timedelta(minutes=5)
    
    model_config = ConfigDict(from_attributes=True)
