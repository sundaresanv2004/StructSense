from datetime import datetime, timezone
from sqlalchemy import Integer, Float, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.db import Base
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .device import Device
    from .processed_sensor_data import ProcessedSensorData

class RawSensorData(Base):
    __tablename__ = "raw_sensor_data"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    device_id: Mapped[int] = mapped_column(ForeignKey("devices.id"), nullable=False, index=True)
    
    # Raw sensor measurements
    tilt_x: Mapped[float] = mapped_column(Float, nullable=False)
    tilt_y: Mapped[float] = mapped_column(Float, nullable=False)
    tilt_z: Mapped[float] = mapped_column(Float, nullable=False)
    # Ultrasonic Distance (in millimeters)
    distance_mm: Mapped[float] = mapped_column(Float, nullable=False)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        index=True,
        nullable=False
    )
    
    # Relationships
    device: Mapped["Device"] = relationship("Device", back_populates="raw_readings")
    processed_reading: Mapped["ProcessedSensorData"] = relationship("ProcessedSensorData", back_populates="raw_reading", uselist=False, cascade="all, delete-orphan")
