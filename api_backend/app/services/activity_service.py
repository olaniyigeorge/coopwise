import json
from typing import List
from redis import Redis
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.utils.cache import get_cache, update_cache
from app.schemas.activity_schemas import ActivityCreate, ActivityDetail
from app.schemas.auth import AuthenticatedUser
from db.models.activity_model import ActivityLog
from datetime import datetime
from uuid import UUID
from app.utils.logger import logger

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
        
        cache_key = f"activities:{user.id}:skip:{1}:limit:{50}"
        cached = await get_cache(cache_key)
        if cached:
            logger.info(f"🔄 Using cached Activities for user {user.id} (skip={1}, limit={50})")
            # Deserialize if values are strings
            deserialized = [
                json.loads(item) if isinstance(item, str) else item
                for item in cached
            ]

            return [ActivityDetail.model_validate(item) for item in deserialized]

        logger.info(f"📬 Fetching Activity logs for user {user.id} from database (skip={1}, limit={50})")
        
        try:
            result = await db.execute(
                    select(ActivityLog).where(ActivityLog.user_id == user.id).order_by(ActivityLog.created_at.desc()).limit(50)
            )
            
            activity_logs = result.scalars().all()
        

            serialized = [
                json.dumps(ActivityDetail.model_validate(i).model_dump(mode="json"))
                for i in activity_logs
            ]

            await update_cache(cache_key, serialized, ttl=4*60)
            return [ActivityDetail.model_validate(json.loads(i)) for i in serialized]

        except Exception as e:
            logger.error(e)
            raise e


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