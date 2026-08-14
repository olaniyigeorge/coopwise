from fastapi import Depends
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession


from src.infra.db.dependencies import get_async_db_session
from src.infra.cache.redis_client import get_redis
from src.domains.dashboard.service import DashboardService


def get_dashboard_service(
    db: AsyncSession = Depends(get_async_db_session),
    redis: Redis = Depends(get_redis),
) -> DashboardService:
    return DashboardService(db=db, redis=redis)
