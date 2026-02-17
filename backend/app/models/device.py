from datetime import datetime, timezone
from sqlalchemy import String, Boolean, Float, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.db import Base
from typing import TYPE_CHECKING, Optional

if TYPE_CHECKING:
    from .sensor_reading import SensorReading

class Device(Base):
    __tablename__ = "devices"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    device_uid: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    type: Mapped[str] = mapped_column(String, nullable=False)
    building_name: Mapped[str | None] = mapped_column(String, nullable=True)
    location_description: Mapped[str | None] = mapped_column(String, nullable=True)
    
    # Threshold percentages for alerts (NEW)
    tilt_threshold_percent: Mapped[float] = mapped_column(Float, default=50.0, nullable=False)
    distance_threshold_percent: Mapped[float] = mapped_column(Float, default=50.0, nullable=False)
    
    # Email for notifications (NEW)
    notification_email: Mapped[str | None] = mapped_column(String, nullable=True)
    
    installed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    connection_status: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    last_seen_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    readings: Mapped[list["SensorReading"]] = relationship(back_populates="device", cascade="all, delete-orphan")
