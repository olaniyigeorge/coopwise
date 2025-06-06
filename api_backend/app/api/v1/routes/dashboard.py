from fastapi import APIRouter, Depends, HTTPException
from redis import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from db.dependencies import get_async_db_session
from app.schemas.auth import AuthenticatedUser
from app.schemas.dashboard_schema import DashboardData
from app.core.dependencies import get_current_user, get_redis
from app.services.dashboard_service import DashboardService

router = APIRouter(
    prefix="/api/v1/dashboard",
    tags=["Dashboard"]
)


@router.get(
        "/", 
        response_model=DashboardData,
        summary="Get full dashboard data for the current user"
    )  
async def get_dashboard_data(
    db: AsyncSession = Depends(get_async_db_session),
    redis: Redis = Depends(get_redis),
    user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Returns a detailed dashboard view for the authenticated user including:
    - Summary of savings and payouts
    - User's savings targets and group goals
    - AI-powered financial insights
    - Recent activities (joins, contributions, payouts)
    - Notifications generated from user events
    - Cooperative members in user's groups
    """
    try:
        dashboard_data = await DashboardService.get_dashboard_data(db, redis, user)
        return dashboard_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
