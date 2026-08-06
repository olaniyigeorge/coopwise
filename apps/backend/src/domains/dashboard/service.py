import asyncio
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession
from redis.asyncio import Redis

from src.domains.users.dependencies import get_user_service
from src.domains.auth.schemas import AuthenticatedUser
from src.domains.dashboard.schemas import DashboardData
from src.shared.utils.logger import logger

from src.domains.cooperatives.service import CooperativeGroupService
from src.domains.analytics.service import ActivityService, SummaryService
from src.domains.insights.service import InsightEngine
from src.domains.notifications.service import NotificationService
from src.domains.memberships.service import CooperativeMembershipService


class DashboardService:
    def __init__(self, *, db: AsyncSession, redis: Redis) -> None:
        self._db = db
        self._redis = redis

    async def get_dashboard_data(self, user: AuthenticatedUser) -> DashboardData:
        logger.info(f"\nBuilding dashboard for user {user.id}\n")

        sections = {
            "user": self._get_user_data(user),
            "summary": self._get_summary(user),
            "targets": self._get_targets(user),
            "groups": self._get_groups(user),
            "activities": self._get_activities(user),
            "ai_insights": self._get_ai_insights(user),
            "notifications": self._get_notifications(user),
            "cooperative_members": self._get_cooperative_members(user),
        }

        list_fields = {"activities", "ai_insights", "notifications", "cooperative_members"}

        results = await asyncio.gather(*sections.values(), return_exceptions=True)
        data: dict[str, Any] = {}
        for key, result in zip(sections.keys(), results):
            if isinstance(result, Exception):
                logger.error(f"Dashboard section '{key}' failed for user {user.id}: {result}")
                data[key] = [] if key in list_fields else None
            else:
                data[key] = result

        print(f"\n\n\n {data}  \n\n\n")
        if data["user"] is None:
            raise ValueError("Failed to load core user data")

        logger.info(f"Dashboard successfully built for user {user.id}")
        return DashboardData(**data)

    async def _get_user_data(self, user: AuthenticatedUser):
        return await get_user_service(db=self._db).get_user_by_id(user.id)

    async def _get_summary(self, user: AuthenticatedUser):
        return await SummaryService.get_user_summary(user, self._db, self._redis)

    async def _get_targets(self, user: AuthenticatedUser):
        return await SummaryService.get_user_targets(user, self._db, self._redis)

    async def _get_groups(self, user: AuthenticatedUser):
        return await CooperativeGroupService.get_user_and_suggested_groups(
            user, self._db, self._redis
        )

    async def _get_activities(self, user: AuthenticatedUser):
        return await ActivityService.get_user_recent_activities(self._db, user, self._redis)

    async def _get_ai_insights(self, user: AuthenticatedUser):
        return await InsightEngine.get_user_insights(
            self._db, user, self._redis, skip=0, limit=10
        )

    async def _get_notifications(self, user: AuthenticatedUser):
        return await NotificationService.get_user_unread_notifications(
            user, self._db, self._redis
        )

    async def _get_cooperative_members(self, user: AuthenticatedUser):
        return await CooperativeMembershipService.get_top_memberships(
            self._db, user, skip=0, limit=20
        )












