from datetime import datetime, timezone
from sqlalchemy import String, Float, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.db import Base
from typing import Optional

class Device(Base):
    __tablename__ = "devices"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    device_uid: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    type: Mapped[str] = mapped_column(String, nullable=False)
    building_name: Mapped[str] = mapped_column(String, nullable=True)
    location_description: Mapped[str] = mapped_column(String, nullable=True)
    baseline_distance_cm: Mapped[float] = mapped_column(Float, nullable=False)
    installed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), 
        nullable=True
    )
    connection_status: Mapped[bool] = mapped_column(default=False)
    last_seen_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    readings = relationship("SensorReading", back_populates="device", cascade="all, delete-orphan")
