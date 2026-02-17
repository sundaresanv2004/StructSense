from datetime import datetime, timezone
from sqlalchemy import Integer, Float, ForeignKey, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.db import Base
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .device import Device

class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    device_id: Mapped[int] = mapped_column(ForeignKey("devices.id"), nullable=False, index=True)
    
    # Raw sensor data from ESP32
    tilt_x: Mapped[float] = mapped_column(Float, nullable=False)
    tilt_y: Mapped[float] = mapped_column(Float, nullable=False)
    tilt_z: Mapped[float] = mapped_column(Float, nullable=False)
    distance_cm: Mapped[float] = mapped_column(Float, nullable=False)
    
    # Calculated percentage changes from initial reading (NEW)
    tilt_change_percent: Mapped[float | None] = mapped_column(Float, nullable=True)
    distance_change_percent: Mapped[float | None] = mapped_column(Float, nullable=True)
    
    # Threshold breach flags (NEW)
    tilt_threshold_breached: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    distance_threshold_breached: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    email_sent: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        index=True,
        nullable=False
    )
    
    # Relationships
    device = relationship("Device", back_populates="readings")
