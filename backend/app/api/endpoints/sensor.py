from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Literal
import csv
import io
import asyncio
from datetime import datetime
import openpyxl
from fastapi.responses import StreamingResponse

from app.core.db import get_db
from app.schemas.sensor import SensorIngestRequest, ProcessedSensorDataResponse, ManualSensorIngestRequest
from app.models.processed_sensor_data import ProcessedSensorData
from app.services.device_service import DeviceService
from app.services.sensor_service import SensorService

router = APIRouter()

@router.post("/ingest", response_model=ProcessedSensorDataResponse, status_code=status.HTTP_201_CREATED)
async def ingest_sensor_data(
    sensor_data: SensorIngestRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Ingest sensor data from ESP32 device.
    """
    # Validate device exists
    device = await DeviceService.get_device_by_uid(db, sensor_data.device_uid)
    
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Device with UID '{sensor_data.device_uid}' not found. "
                   f"Device must be registered before sending data."
        )
    
    # Process and store sensor reading
    reading = await SensorService.ingest_sensor_data(db, device, sensor_data)
    
    return reading

@router.post("/ingest/manual", response_model=ProcessedSensorDataResponse, status_code=status.HTTP_201_CREATED)
async def ingest_manual_sensor_data(
    sensor_data: ManualSensorIngestRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Manually ingest sensor data with optional custom timestamp.
    """
    # Validate device exists
    device = await DeviceService.get_device_by_uid(db, sensor_data.device_uid)
    
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Device with UID '{sensor_data.device_uid}' not found."
        )
    
    # Process and store sensor reading with custom timestamp
    reading = await SensorService.ingest_sensor_data(
        db, 
        device, 
        sensor_data, 
        timestamp=sensor_data.timestamp
    )
    
    return reading

@router.get("/devices/{device_id}/processed", response_model=List[ProcessedSensorDataResponse])
async def get_processed_data(
    device_id: int,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """
    Get processed sensor data for a specific device.
    """
    result = await db.execute(
        select(ProcessedSensorData)
        .where(ProcessedSensorData.device_id == device_id)
        .order_by(ProcessedSensorData.created_at.desc())
        .limit(limit)
    )
    return result.scalars().all()


@router.get("/devices/{device_id}/export")
async def export_sensor_data(
    device_id: int,
    format: Literal["csv", "xlsx"] = "csv",
    limit: int = 1000,
    db: AsyncSession = Depends(get_db)
):
    """
    Export processed sensor data as CSV or Excel.
    """
    # 1. Fetch Data
    result = await db.execute(
        select(ProcessedSensorData)
        .where(ProcessedSensorData.device_id == device_id)
        .order_by(ProcessedSensorData.created_at.desc())
        .limit(limit)
    )
    data = result.scalars().all()
    
    filename = f"sensor_data_device_{device_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

    if format == "csv":
        async def iter_csv():
            output = io.StringIO()
            writer = csv.writer(output)
            
            # Headers
            headers = [
                "ID", "Created At", "Status",
                "Tilt Diff X", "Tilt Diff Y", "Tilt Diff Z",
                "Distance Diff (mm)",
                "Tilt Change %", "Distance Change %"
            ]
            writer.writerow(headers)
            output.seek(0)
            yield output.read()
            output.truncate(0)
            output.seek(0)
            
            # Rows
            for row in data:
                writer.writerow([
                    row.id,
                    row.created_at.isoformat(),
                    row.status,
                    row.tilt_diff_x,
                    row.tilt_diff_y,
                    row.tilt_diff_z,
                    row.distance_diff_mm,
                    row.tilt_change_percent,
                    row.distance_change_percent
                ])
                output.seek(0)
                yield output.read()
                output.truncate(0)
                output.seek(0)

        return StreamingResponse(
            iter_csv(),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}.csv"}
        )
        
    elif format == "xlsx":
        def generate_excel():
            workbook = openpyxl.Workbook()
            sheet = workbook.active
            sheet.title = "Sensor Data"
            
            # Headers
            headers = [
                "ID", "Created At", "Status",
                "Tilt Diff X", "Tilt Diff Y", "Tilt Diff Z",
                "Distance Diff (mm)",
                "Tilt Change %", "Distance Change %"
            ]
            sheet.append(headers)
            
            # Rows
            for row in data:
                sheet.append([
                    row.id,
                    row.created_at.replace(tzinfo=None), # Excel doesn't like timezone aware datetimes sometimes
                    row.status,
                    row.tilt_diff_x,
                    row.tilt_diff_y,
                    row.tilt_diff_z,
                    row.distance_diff_mm,
                    row.tilt_change_percent,
                    row.distance_change_percent
                ])
                
            output = io.BytesIO()
            workbook.save(output)
            output.seek(0)
            return output

        loop = asyncio.get_running_loop()
        output = await loop.run_in_executor(None, generate_excel)
        
        return StreamingResponse(
            output,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}.xlsx"}
        )
