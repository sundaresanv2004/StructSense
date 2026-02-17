from pydantic import BaseModel, ConfigDict
from typing import Optional

class DeviceBase(BaseModel):
    device_uid: str
    name: str
    type: str
    location: Optional[str] = None
    connection_status: bool = False

class DeviceCreate(DeviceBase):
    pass

class DeviceUpdate(DeviceBase):
    device_uid: Optional[str] = None
    name: Optional[str] = None
    type: Optional[str] = None
    location: Optional[str] = None
    connection_status: Optional[bool] = None

class DeviceResponse(DeviceBase):
    id: int
    
    model_config = ConfigDict(from_attributes=True)
