
import asyncio
from unittest.mock import MagicMock, AsyncMock
from datetime import datetime, timezone
from app.services.sensor_service import SensorService
from app.schemas.sensor import SensorIngestRequest
from app.models.device import Device
from app.models.raw_sensor_data import RawSensorData

async def verify_logic():
    print("Verifying SensorService Logic...")
    
    # Mock DB Session
    db = AsyncMock()
    
    # Mock Device
    device = Device(
        id=1,
        tilt_warning_threshold=30.0,
        tilt_alert_threshold=50.0,
        distance_warning_threshold=5.0,
        distance_alert_threshold=10.0
    )
    
    # Scenario 1: Initial Reading (Baseline)
    # We simulate that there is NO previous reading, so this becomes baseline
    SensorService.get_initial_reading = AsyncMock(return_value=None)
    
    req1 = SensorIngestRequest(
        device_uid="test_dev",
        tilt_x=0.0, tilt_y=0.0, tilt_z=0.0,
        distance_mm=100.0
    )
    
    # We need to mock db.add to capture the raw reading so we can return it as "initial" next time if needed
    # But SensorService logic calls get_initial_reading internally.
    # Logic: 
    # 1. Save Raw
    # 2. Get Initial (if None, use current raw values as base)
    
    # Let's just test the calculation logic extraction if possible, or run the full ingest.
    # running ingest is better.
    
    processed1 = await SensorService.ingest_sensor_data(db, device, req1)
    
    print(f"Reading 1 (Baseline): Distance Raw={req1.distance_mm}")
    print(f"  Processed Diff: {processed1.distance_diff_mm} (Expect 0.0)")
    print(f"  Processed %: {processed1.distance_change_percent} (Expect 0.0)")
    
    # Scenario 2: sink (Distance Decreases) -> Positive Diff
    # Now valid baseline exists
    baseline_reading = RawSensorData(
        tilt_x=0.0, tilt_y=0.0, tilt_z=0.0,
        distance_mm=100.0,
        created_at=datetime.now(timezone.utc)
    )
    SensorService.get_initial_reading = AsyncMock(return_value=baseline_reading)
    
    req2 = SensorIngestRequest(
        device_uid="test_dev",
        tilt_x=0.0, tilt_y=0.0, tilt_z=0.0,
        distance_mm=90.0 # 10mm sink
    )
    
    processed2 = await SensorService.ingest_sensor_data(db, device, req2)
    print(f"Reading 2 (Sink 10mm): Distance Raw={req2.distance_mm}")
    print(f"  Processed Diff: {processed2.distance_diff_mm} (Expect 10.0)")
    print(f"  Processed %: {processed2.distance_change_percent} (Expect 10.0)")

    # Scenario 3: Rise (Distance Increases) -> Negative Diff (User Requirement)
    req3 = SensorIngestRequest(
        device_uid="test_dev",
        tilt_x=0.0, tilt_y=0.0, tilt_z=0.0,
        distance_mm=110.0 # 10mm rise
    )
    
    processed3 = await SensorService.ingest_sensor_data(db, device, req3)
    print(f"Reading 3 (Rise 10mm): Distance Raw={req3.distance_mm}")
    print(f"  Processed Diff: {processed3.distance_diff_mm} (Expect -10.0)")
    print(f"  Processed %: {processed3.distance_change_percent} (Expect -10.0)")

if __name__ == "__main__":
    asyncio.run(verify_logic())
