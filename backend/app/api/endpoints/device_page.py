from fastapi import APIRouter, Depends, Request, Form
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
from typing import Optional

from app.core.db import get_db
from app.services.device_service import DeviceService
from app.schemas.device import DeviceRegister
from app.models.user import User
from app.models.access import UserDeviceAccess, UserDeviceAccessLevel

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")

@router.get("/register", response_class=HTMLResponse)
async def devices_register_page(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Render device registration form and device list.
    """
    # Get all devices
    devices = await DeviceService.get_all_devices(db)
    
    # Get all users for dropdown
    result = await db.execute(select(User).order_by(User.email))
    users = result.scalars().all()
    
    return templates.TemplateResponse("devices.html", {
        "request": request,
        "devices": devices,
        "users": users
    })


@router.post("/register", response_class=HTMLResponse)
async def register_device_form(
    request: Request,
    device_uid: str = Form(...),
    name: str = Form(...),
    type: str = Form(...),
    building_name: str = Form(None),
    location_description: str = Form(None),
    baseline_distance_cm: float = Form(...),
    assign_user_id: Optional[int] = Form(None),
    access_level: Optional[str] = Form("viewer"),
    db: AsyncSession = Depends(get_db)
):
    """
    Handle device registration from HTML form with optional user assignment.
    """
    try:
        # Create device
        device_data = DeviceRegister(
            device_uid=device_uid,
            name=name,
            type=type,
            building_name=building_name,
            location_description=location_description,
            baseline_distance_cm=baseline_distance_cm,
            installed_at=datetime.now()
        )
        
        device = await DeviceService.register_device(db, device_data)
        
        # Assign user if selected
        success_message = f"Device '{device.name}' registered successfully!"
        if assign_user_id:
            # Create user-device access
            access = UserDeviceAccess(
                user_id=assign_user_id,
                device_id=device.id,
                access_level=UserDeviceAccessLevel.ADMIN if access_level == "admin" else UserDeviceAccessLevel.VIEWER
            )
            db.add(access)
            await db.commit()
            
            # Get user email for message
            result = await db.execute(select(User).where(User.id == assign_user_id))
            user = result.scalars().first()
            if user:
                success_message += f" Assigned to {user.email} with {access_level} access."
        
        # Get updated device list and users
        devices = await DeviceService.get_all_devices(db)
        result = await db.execute(select(User).order_by(User.email))
        users = result.scalars().all()
        
        return templates.TemplateResponse("devices.html", {
            "request": request,
            "devices": devices,
            "users": users,
            "message": success_message,
            "message_class": "success"
        })
        
    except Exception as e:
        # Get current device list and users
        devices = await DeviceService.get_all_devices(db)
        result = await db.execute(select(User).order_by(User.email))
        users = result.scalars().all()
        
        return templates.TemplateResponse("devices.html", {
            "request": request,
            "devices": devices,
            "users": users,
            "message": str(e),
            "message_class": "error"
        })


