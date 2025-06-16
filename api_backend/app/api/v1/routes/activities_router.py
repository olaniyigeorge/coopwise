from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.auth import AuthenticatedUser
from app.api.v1.routes.auth import get_current_user
from app.schemas.activity_schemas import ActivityDetail
from db.dependencies import get_async_db_session
from db.models.activity_model import ActivityLog


router = APIRouter(
    prefix="/api/v1/activities", 
    tags=["Activities"]
    )



@router.get("/me", response_model=List[ActivityDetail])
async def get_user_activities(
    db: AsyncSession = Depends(get_async_db_session),
    user: AuthenticatedUser = Depends(get_current_user)
):
    result = await db.execute(
        select(ActivityLog).where(ActivityLog.user_id == user.id).order_by(ActivityLog.created_at.desc()).limit(50)
    )
    return result.scalars().all()