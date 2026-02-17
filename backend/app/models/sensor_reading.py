from datetime import datetime
from enum import Enum
from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, Enum as SQLAlchemyEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.db import Base

class TiltStatus(str, Enum):
    SAFE = "SAFE"
    WARNING = "WARNING"
    RISK = "RISK"
    DANGER = "DANGER"

class SettlementStatus(str, Enum):
    NORMAL = "NORMAL"
    SHIFT = "SHIFT"
    CRITICAL = "CRITICAL"

class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    device_id: Mapped[int] = mapped_column(Integer, ForeignKey("devices.id"), nullable=False, index=True)

    # Tilt data
    tilt_x_deg: Mapped[float] = mapped_column(Float, nullable=False)
    tilt_y_deg: Mapped[float] = mapped_column(Float, nullable=False)
    tilt_z_deg: Mapped[float] = mapped_column(Float, nullable=True)

    # Settlement data
    distance_cm: Mapped[float] = mapped_column(Float, nullable=False)
    settlement_cm: Mapped[float] = mapped_column(Float, nullable=False)

    # System evaluation
    tilt_status: Mapped[TiltStatus] = mapped_column(SQLAlchemyEnum(TiltStatus), nullable=False, default=TiltStatus.SAFE)
    settlement_status: Mapped[SettlementStatus] = mapped_column(SQLAlchemyEnum(SettlementStatus), nullable=False, default=SettlementStatus.NORMAL)

    # Metadata
    recorded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    device = relationship("Device", back_populates="readings")
