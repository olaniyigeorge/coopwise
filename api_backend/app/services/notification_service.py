# Send reminders, alerts, and AI insights via app/SMS.

# Schedule future alerts.from typing import List
from datetime import datetime
from typing import List
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from redis.asyncio import Redis

from db.models.notifications import Notification
from app.schemas.auth import AuthenticatedUser
from app.utils.cache import get_cache, update_cache
from app.utils.logger import logger
from app.schemas.notifications_schema import NotificationDetail  # assuming this is your output schema


class NotificationService:
    @staticmethod
    async def get_user_notifications(
        user: AuthenticatedUser,
        db: AsyncSession,
        redis: Redis,
        limit: int = 20
    ) -> List[NotificationDetail]:
        """
        Returns recent notifications for a given user with Redis caching.
        """
        cache_key = f"user:{user.id}:notifications"
        cached = await get_cache(cache_key)
        if cached:
            logger.info(f"🔄 Using cached notifications for user {user.id}")
            return cached

        logger.info(f"📬 Fetching notifications from DB for user {user.id}")
        stmt = (
            select(Notification)
            .where(Notification.user_id == user.id)
            .order_by(Notification.created_at.desc())
            .limit(limit)
            .options(joinedload(Notification.user))
        )

        result = await db.execute(stmt)
        notifications: List[Notification] = result.scalars().all()

        # Convert to Pydantic schema
        serialized = [NotificationDetail.model_validate(n) for n in notifications]

        await update_cache(cache_key, serialized, ttl=300)
        logger.info(f"📦 Cached notifications for user {user.id}")
        return serialized

    @staticmethod
    async def mark_all_as_read(user_id: UUID, db: AsyncSession):
        """
        Marks all notifications as read for the given user.
        """
        stmt = (
            select(Notification)
            .where(Notification.user_id == user_id, Notification.status == "unread")
        )

        result = await db.execute(stmt)
        unread_notifications = result.scalars().all()

        for notification in unread_notifications:
            notification.status = "read"
            notification.is_read = True
            notification.read_at = datetime.now()

        await db.commit()
        return {"message": f"{len(unread_notifications)} notifications marked as read."}
