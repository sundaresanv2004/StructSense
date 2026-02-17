import asyncio
import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import AsyncSessionLocal
from app.core.security import get_password_hash
from app.models.user import User
from sqlalchemy import select

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def create_superuser() -> None:
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.email == "admin@structsense.com"))
        user = result.scalars().first()
        
        if not user:
            user = User(
                email="admin@structsense.com",
                hashed_password=get_password_hash("admin"),
                is_superuser=True,
                is_active=True,
            )
            session.add(user)
            await session.commit()
            logger.info("Superuser created")
        else:
            logger.info("Superuser already exists")

if __name__ == "__main__":
    asyncio.run(create_superuser())
