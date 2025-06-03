from typing import List
from redis import Redis
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas.activity_schemas import ActivityCreate, ActivityDetail
from app.schemas.auth import AuthenticatedUser
from db.models.activity_model import ActivityLog
from datetime import datetime
from uuid import UUID

class ActivityService:
    @staticmethod
    async def log(
        db: AsyncSession,
        activity_data: ActivityCreate
    ):
        activity = ActivityLog(
            user_id=activity_data.user_id,
            type=activity_data.type,
            description=activity_data.description,
            group_id=activity_data.group_id,
            entity_id=str(activity_data.entity_id),
            amount=activity_data.amount,
            created_at=datetime.now()
        )
        db.add(activity)
        await db.commit()
        await db.refresh(activity)
        return activity



    @staticmethod
    async def get_user_recent_activities(
        db: AsyncSession, 
        user: AuthenticatedUser, 
        redis: Redis
    ) -> List[ActivityDetail]:
        result = await db.execute(
                select(ActivityLog).where(ActivityLog.user_id == user.id).order_by(ActivityLog.created_at.desc()).limit(50)
        )
        
        return result.scalars().all()
    

    @staticmethod
    async def get_group_activities(
        db: AsyncSession, 
        group_id: UUID,
        user: AuthenticatedUser, 
        redis: Redis,
        skip: int = 0, 
        limit: int = 20
    ):
        result = await db.execute(
            select(ActivityLog).where(ActivityLog.group_id == group_id).order_by(ActivityLog.created_at.desc()).limit(limit)
        )
        return result.scalars().all()