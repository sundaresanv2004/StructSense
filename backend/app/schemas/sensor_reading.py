from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.models.sensor_reading import TiltStatus, SettlementStatus

class SensorReadingBase(BaseModel):
    tilt_x_deg: float
    tilt_y_deg: float
    tilt_z_deg: Optional[float] = None
    distance_cm: float
    settlement_cm: float
    tilt_status: TiltStatus
    settlement_status: SettlementStatus
    recorded_at: Optional[datetime] = None

class SensorReadingCreate(SensorReadingBase):
    device_id: int

class SensorReadingResponse(SensorReadingBase):
    id: int
    device_id: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
