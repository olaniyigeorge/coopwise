# Send reminders, alerts, and AI insights via app/SMS.

# Schedule future alerts.from typing import List
from datetime import datetime
from typing import Dict, List
from uuid import UUID

from fastapi import WebSocket
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from redis.asyncio import Redis

from db.models.notifications import Notification
from app.schemas.auth import AuthenticatedUser
from app.utils.cache import get_cache, update_cache
from app.utils.logger import logger
from app.schemas.notifications_schema import NotificationCreate, NotificationDetail  # assuming this is your output schema

active_connections: Dict[int, List[WebSocket]] = {}


class NotificationService:
    @staticmethod
    async def create_notification_and_push_notification(
        notification_data: NotificationCreate,
        db: AsyncSession 
    ) -> NotificationDetail:
        """
        Creates a notification and pushes it to the user via WebSocket.
        """
        notification = Notification(
            user_id = notification_data.user_id,
            title = notification_data.title,
            message = notification_data.message,
            type = notification_data.type,
            event_type = notification_data.event_type,
            entity_url = notification_data.entity_url
        )

        db.add(notification)
        await db.commit()
        await db.refresh(notification)

        # Convert to Pydantic schema
        notification_detail = NotificationDetail.model_validate(notification)

        # Push notification to user via WebSocket
        await NotificationService.push_notification_to_user(notification_data.user_id, notification_detail)
        return notification_detail
    


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


    @staticmethod
    async def push_notification_to_user(user_id: int, notification_data: NotificationDetail):
        connections = active_connections.get(user_id, [])
        for ws in connections:
            await ws.send_json(notification_data.model_dump_json())




    @staticmethod
    async def broadcast_notification(title: str, message: str, payload: dict, db: AsyncSession):
        # You can use a background task or queue for this if scale matters
        from app.services.user_service import UserService

        users = await UserService.get_all_users(db)
        for user in users:
            await NotificationService.push_notification(
                user_id=user.id,
                title=title,
                message=message,
                payload=payload,
                db=db
            )