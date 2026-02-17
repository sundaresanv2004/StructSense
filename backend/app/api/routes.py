from fastapi import APIRouter
from .endpoints import health, auth, signup, users

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(signup.router)
api_router.include_router(users.router, prefix="/users", tags=["users"])
