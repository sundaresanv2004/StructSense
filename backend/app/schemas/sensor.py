from pydantic import BaseModel, ConfigDict
from datetime import datetime

class SensorIngestRequest(BaseModel):
    """Schema for ESP32 sensor data ingestion"""
    device_uid: str
    tilt_x: float
    tilt_y: float
    tilt_z: float
    distance_cm: float

class SensorReadingResponse(BaseModel):
    """Schema for sensor reading response"""
    id: int
    device_id: int
    tilt_x: float
    tilt_y: float
    tilt_z: float
    distance_cm: float
    settlement_cm: float
    tilt_status: str
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
