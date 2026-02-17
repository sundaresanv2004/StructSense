from datetime import datetime, timezone
from sqlalchemy import Float, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.db import Base

class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    device_id: Mapped[int] = mapped_column(ForeignKey("devices.id"), nullable=False, index=True)

    # Tilt data (accelerometer readings)
    tilt_x: Mapped[float] = mapped_column(Float, nullable=False)
    tilt_y: Mapped[float] = mapped_column(Float, nullable=False)
    tilt_z: Mapped[float] = mapped_column(Float, nullable=False)

    # Ultrasonic distance measurement
    distance_cm: Mapped[float] = mapped_column(Float, nullable=False)

    # Calculated settlement (baseline - distance)
    settlement_cm: Mapped[float] = mapped_column(Float, nullable=False)

    # Evaluated tilt status (SAFE, WARNING, RISK, DANGER)
    tilt_status: Mapped[str] = mapped_column(nullable=False)

    # Timestamp
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        index=True
    )

    # Relationships
    device = relationship("Device", back_populates="readings")
