from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class SensorIngestRequest(BaseModel):
    """
    Schema for ESP32 sensor data ingestion.
    """
    device_uid: str
    tilt_x: float
    tilt_y: float
    tilt_z: float
    distance_mm: float

class ProcessedSensorDataResponse(BaseModel):
    """
    Schema for processed sensor data response.
    """
    id: int
    device_id: int
    raw_data_id: int
    
    # Calculated differences
    tilt_diff_x: float
    tilt_diff_y: float
    tilt_diff_z: float
    distance_diff_mm: float
    
    # Combined metrics
    tilt_change_percent: float
    distance_change_percent: float
    
    # Status
    status: str
    
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
