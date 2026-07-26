from fastapi import APIRouter, Depends, HTTPException
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from src.domains.dashboard.dependencies import get_dashboard_service
from src.infra.db.dependencies import get_async_db_session
from src.domains.auth.schemas import AuthenticatedUser
from src.domains.dashboard.schemas import DashboardData
from src.api.middlewares.dependencies import get_current_user
from src.infra.cache.redis_client import get_redis
from src.domains.dashboard.service import DashboardService
from src.shared.utils.logger import logger

router = APIRouter(prefix="/api/v1/dashboard", tags=["Dashboard"])


@router.get(
    "/",
    response_model=DashboardData,
    summary="Get full dashboard data for the current user",
)
async def get_dashboard_data(
    service: DashboardService = Depends(get_dashboard_service),
    user: AuthenticatedUser = Depends(get_current_user),
):
    try:
        return await service.get_dashboard_data(user)
    except Exception:
        logger.exception(f"Failed to build dashboard for user {user.id}")
        raise HTTPException(status_code=500, detail="Failed to load dashboard")