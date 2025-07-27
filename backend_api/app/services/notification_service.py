# Send reminders, alerts, and AI insights via app/SMS.

# Schedule future alerts.from typing import List
from datetime import datetime
from typing import Dict, List, Tuple
from uuid import UUID

from fastapi import HTTPException, WebSocket
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import case, func, select
from sqlalchemy.orm import joinedload
from redis.asyncio import Redis

from db.models.notifications import Notification, NotificationStatus
from app.schemas.auth import AuthenticatedUser
from app.utils.cache import get_cache, update_cache
from app.utils.logger import logger
from app.schemas.notifications_schema import (
    NotificationCreate,
    NotificationDetail,
)  # assuming this is your output schema

active_connections: Dict[int, List[WebSocket]] = {}


class NotificationService:
    @staticmethod
    async def create_and_push_notification_to_user(
        notification_data: NotificationCreate, db: AsyncSession
    ) -> NotificationDetail:
        """
        Creates a notification and pushes it to the user via WebSocket.
        """
        notification = Notification(
            user_id=notification_data.user_id,
            title=notification_data.title,
            message=notification_data.message,
            type=notification_data.type,
            event_type=notification_data.event_type,
            entity_url=notification_data.entity_url,
        )

        db.add(notification)
        await db.commit()
        await db.refresh(notification)

        # Convert to Pydantic schema
        notification_detail = NotificationDetail.model_validate(notification)

        # Push notification to user via WebSocket
        await NotificationService.push_notification_to_user(
            notification_data.user_id, notification_detail
        )
        return notification_detail

    @staticmethod
    async def get_user_unread_notifications(
        user: AuthenticatedUser, db: AsyncSession, redis: Redis, limit: int = 20
    ) -> List[NotificationDetail]:
        """
        Returns recent notifications for a given user with Redis caching.
        """
        cache_key = f"user:{user.id}:unread_notifications"
        cached = await get_cache(cache_key)
        if cached:
            logger.info(f"🔄 Using cached notifications for user {user.id}")
            return cached

        logger.info(f"📬 Fetching notifications from DB for user {user.id}")
        stmt = (
            select(Notification)
            .where(Notification.user_id == user.id)
            .where(Notification.status == NotificationStatus.unread)
            .order_by(Notification.created_at.desc())
            .limit(limit)
            .options(joinedload(Notification.user))
        )

        result = await db.execute(stmt)
        notifications: List[Notification] = result.scalars().all()

        # Convert to Pydantic schema
        serialized = [NotificationDetail.model_validate(n) for n in notifications]

        # Serialize list of Pydantic models to JSON-serializable format (list of dicts)
        serialized_json = [n.model_dump(mode="json") for n in serialized]

        await update_cache(cache_key, serialized_json, ttl=300)
        logger.info(f"📦 Cached notifications for user {user.id}")
        return serialized

    @staticmethod
    async def get_user_notifications(
        user: AuthenticatedUser,
        db: AsyncSession,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[NotificationDetail], int]:
        """
        Returns paginated notifications for a given user, ordered by:
        1. Unread
        2. Read
        3. Archived
        """

        # Define custom order by NotificationStatus
        status_order = case(
            (Notification.status == NotificationStatus.unread, 0),
            (Notification.status == NotificationStatus.read, 1),
            (Notification.status == NotificationStatus.archived, 2),
            else_=3,
        )

        stmt = (
            select(Notification)
            .where(Notification.user_id == user.id)
            .order_by(status_order, Notification.created_at.desc())
            .limit(page_size)
            .offset((page - 1) * page_size)
            .options(joinedload(Notification.user))
        )

        count_stmt = select(func.count(Notification.id)).where(
            Notification.user_id == user.id
        )

        notifications_result = await db.execute(stmt)
        notifications = notifications_result.scalars().all()

        count_result = await db.execute(count_stmt)
        total_count = count_result.scalar_one()

        serialized = [NotificationDetail.model_validate(n) for n in notifications]

        return serialized, total_count

    @staticmethod
    async def mark_all_as_read(
        db: AsyncSession,
        user: AuthenticatedUser,
    ):
        """
        Marks all notifications as read for the given user.
        """
        try:
            stmt = select(Notification).where(
                Notification.user_id == user.id,
                Notification.status == NotificationStatus.unread,
            )

            result = await db.execute(stmt)
            unread_notifications = result.scalars().all()

            for notification in unread_notifications:
                notification.status = NotificationStatus.read
                notification.is_read = True
                notification.read_at = datetime.now()

            await db.commit()
            return {
                "message": f"{len(unread_notifications)} notifications marked as read."
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @staticmethod
    async def push_notification_to_user(
        user_id: int, notification_data: NotificationDetail
    ):
        connections = active_connections.get(user_id, [])
        for ws in connections:
            await ws.send_json(notification_data.model_dump_json())

    @staticmethod
    async def broadcast_notification(
        title: str, message: str, payload: dict, db: AsyncSession
    ):

        # You can use a background task or queue for this if scale matters
        from app.services.user_service import UserService

        users = await UserService.get_users(db)
        for user in users:
            await NotificationService.push_notification_to_user(
                user_id=user.id, title=title, message=message, payload=payload, db=db
            )

    @staticmethod
    async def get_notification_by_id(
        db: AsyncSession,
        user: AuthenticatedUser,
        notification_id: int,
    ) -> NotificationDetail:
        """
        Fetches a specific notification by ID for the given user.
        """
        stmt = (
            select(Notification)
            .where(Notification.id == notification_id, Notification.user_id == user.id)
            .options(joinedload(Notification.user))
        )

        result = await db.execute(stmt)
        notification = result.scalar_one_or_none()

        if not notification:
            raise ValueError("Notification not found or does not belong to the user.")

        return NotificationDetail.model_validate(notification)

    @staticmethod
    async def mark_notification(
        db: AsyncSession,
        user: AuthenticatedUser,
        notification_id: int,
        status: NotificationStatus,
    ) -> NotificationDetail:
        """
        Marks a notification as read, archived, or deleted.
        """
        stmt = (
            select(Notification)
            .where(Notification.id == notification_id, Notification.user_id == user.id)
            .options(joinedload(Notification.user))
        )

        result = await db.execute(stmt)
        notification = result.scalar_one_or_none()

        if not notification:
            raise ValueError("Notification not found or does not belong to the user.")

        notification.status = status
        if status == NotificationStatus.read:
            notification.is_read = True
            notification.read_at = datetime.now()

        await db.commit()
        await db.refresh(notification)

        return NotificationDetail.model_validate(notification)
