from fastapi import APIRouter
from .endpoints import health, auth, signup, users, devices, sensor, device_page

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(signup.router)
api_router.include_router(users.router, prefix="/users", tags=["users"])
# HTML page router MUST come before API router to match /register before /{device_id}
api_router.include_router(device_page.router, prefix="/devices", tags=["devices-ui"])
api_router.include_router(devices.router, prefix="/devices", tags=["devices"])
api_router.include_router(sensor.router, prefix="/sensor", tags=["sensor"])



