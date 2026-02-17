from sqlalchemy import ForeignKey, Enum
from sqlalchemy.orm import Mapped, mapped_column
from app.core.db import Base
import enum

class UserDeviceAccessLevel(str, enum.Enum):
    ADMIN = "admin"
    VIEWER = "viewer"

class UserDeviceAccess(Base):
    __tablename__ = "user_device_access"
    
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), primary_key=True)
    device_id: Mapped[int] = mapped_column(ForeignKey("devices.id"), primary_key=True)
    access_level: Mapped[UserDeviceAccessLevel] = mapped_column(default=UserDeviceAccessLevel.VIEWER)
