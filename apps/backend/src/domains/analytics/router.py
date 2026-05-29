from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domains.auth.schemas import AuthenticatedUser
from src.api.middlewares.dependencies import get_current_user
from src.domains.analytics.schemas import ActivityDetail
from src.infra.db.dependencies import get_async_db_session
from src.domains.analytics.models import ActivityLog


router = APIRouter(prefix="/api/v1/activities", tags=["Activities"])


@router.get("/me", response_model=List[ActivityDetail])
async def get_user_activities(
    db: AsyncSession = Depends(get_async_db_session),
    user: AuthenticatedUser = Depends(get_current_user),
):
    result = await db.execute(
        select(ActivityLog)
        .where(ActivityLog.user_id == user.id)
        .order_by(ActivityLog.created_at.desc())
        .limit(50)
    )
    return result.scalars().all()
