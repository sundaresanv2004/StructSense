from datetime import datetime, timezone
from sqlalchemy import Integer, Float, ForeignKey, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.db import Base
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .device import Device
    from .raw_sensor_data import RawSensorData

class ProcessedSensorData(Base):
    __tablename__ = "processed_sensor_data"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    device_id: Mapped[int] = mapped_column(ForeignKey("devices.id"), nullable=False, index=True)
    raw_data_id: Mapped[int] = mapped_column(ForeignKey("raw_sensor_data.id"), nullable=False, unique=True)
    
    # Calculated differences from baseline
    tilt_diff_x: Mapped[float] = mapped_column(Float, nullable=False)
    tilt_diff_y: Mapped[float] = mapped_column(Float, nullable=False)
    tilt_diff_z: Mapped[float] = mapped_column(Float, nullable=False)
    distance_diff_cm: Mapped[float] = mapped_column(Float, nullable=False)
    
    # Combined metrics for threshold checking
    tilt_change_percent: Mapped[float] = mapped_column(Float, nullable=False)
    distance_change_percent: Mapped[float] = mapped_column(Float, nullable=False)
    
    # Status: SAFE, WARNING, ALERT
    status: Mapped[str] = mapped_column(String, nullable=False, default="SAFE")
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        index=True,
        nullable=False
    )
    
    # Relationships
    device: Mapped["Device"] = relationship("Device", back_populates="processed_readings")
    raw_reading: Mapped["RawSensorData"] = relationship("RawSensorData", back_populates="processed_reading")
