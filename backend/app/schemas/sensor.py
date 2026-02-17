from pydantic import BaseModel
from datetime import datetime

class SensorIngestRequest(BaseModel):
    """
    Schema for ESP32 sensor data ingestion.
    """
    device_uid: str
    tilt_x: float
    tilt_y: float
    tilt_z: float
    distance_cm: float

class SensorReadingResponse(BaseModel):
    """
    Schema for sensor reading response with threshold monitoring.
    """
    id: int
    device_id: int
    tilt_x: float
    tilt_y: float
    tilt_z: float
    distance_cm: float
    
    # Percentage changes from initial reading
    tilt_change_percent: float | None
    distance_change_percent: float | None
    
    # Threshold breach flags
    tilt_threshold_breached: bool
    distance_threshold_breached: bool
    
    created_at: datetime
    
    class Config:
        from_attributes = True
