from pydantic import BaseModel, ConfigDict
from app.models.access import UserDeviceAccessLevel

class UserDeviceAccessBase(BaseModel):
    user_id: int
    device_id: int
    access_level: UserDeviceAccessLevel = UserDeviceAccessLevel.VIEWER

class UserDeviceAccessCreate(UserDeviceAccessBase):
    pass

class UserDeviceAccessUpdate(BaseModel):
    access_level: UserDeviceAccessLevel

class UserDeviceAccessResponse(UserDeviceAccessBase):
    model_config = ConfigDict(from_attributes=True)
