from typing import AsyncGenerator
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as redis_async
from redis.asyncio.client import Redis

from app.core.config import config
from db.database import AsyncSessionLocal
from app.services.cashramp_service import CashRampService
from app.api.v1.routes.auth import get_current_user, is_admin_or_owner

# ---------------------------- 🔁 Redis Dependency ----------------------------
redis_client: Redis = redis_async.from_url(config.REDIS_URL)

async def get_redis() -> Redis:
    return redis_client

# ---------------------------- 💳 CashRamp Service Dependency ----------------------------
def get_cashramp_service(redis: Redis = Depends(get_redis)) -> CashRampService:
    return CashRampService(redis=redis)


# ---------------------------- 👤 User + Role Dependencies ----------------------------
user_dependency = Depends(get_current_user)
admin_or_owner_dependency = Depends(is_admin_or_owner)




# ---------------------------- 🧠 Database Session Dependency   ----------------------------

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session
