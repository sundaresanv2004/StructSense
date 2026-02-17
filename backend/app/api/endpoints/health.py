from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.core.db import get_db

router = APIRouter()

@router.get("/health", tags=["health"])
async def health_check(db: AsyncSession = Depends(get_db)):
    try:
        # Check database connection
        await db.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": "disconnected", "error": str(e)}
