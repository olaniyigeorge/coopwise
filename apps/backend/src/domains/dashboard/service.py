import asyncio
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession
from redis.asyncio import Redis

from src.domains.users.dependencies import get_user_service
from src.domains.users.schemas import UserDetail
from src.domains.auth.schemas import AuthenticatedUser
from src.domains.dashboard.schemas import DashboardData
from src.infra.db.database import db_manager
from src.shared.utils.logger import logger

from src.domains.cooperatives.services.cooperative_service import CooperativeService
from src.domains.cooperatives.uow import UnitOfWork
from src.domains.analytics.service import ActivityService, SummaryService
from src.domains.insights.service import InsightEngine
from src.domains.notifications.service import NotificationService
from src.domains.memberships.service import CooperativeMembershipService


class DashboardService:
    def __init__(self, *, db: AsyncSession, redis: Redis) -> None:
        self._db = db
        self._redis = redis

    async def _run_section(self, method: str, user: AuthenticatedUser):
        """Each section gets its own session so the reads actually overlap.

        One shared AsyncSession cannot run concurrent queries, which is why
        the home page used to wait on the slowest section.
        """
        async with db_manager.get_session() as session:
            worker = DashboardService(db=session, redis=self._redis)
            return await getattr(worker, method)(user)

    async def get_dashboard_data(self, user: AuthenticatedUser) -> DashboardData:
        logger.info(f"\nBuilding dashboard for user {user.id}\n")

        sections = {
            "user": "_get_user_data",
            "summary": "_get_summary",
            "targets": "_get_targets",
            "groups": "_get_groups",
            "activities": "_get_activities",
            "ai_insights": "_get_ai_insights",
            "notifications": "_get_notifications",
            "cooperative_members": "_get_cooperative_members",
        }

        list_fields = {
            "activities",
            "ai_insights",
            "notifications",
            "cooperative_members",
        }

        results = await asyncio.gather(
            *(self._run_section(method, user) for method in sections.values()),
            return_exceptions=True,
        )
        data: dict[str, Any] = {}
        for key, result in zip(sections.keys(), results):
            if isinstance(result, Exception):
                logger.error(
                    f"Dashboard section '{key}' failed for user {user.id}: {result}"
                )
                data[key] = [] if key in list_fields else None
            else:
                data[key] = result

        if data["user"] is None:
            raise ValueError("Failed to load core user data")

        logger.info(f"Dashboard successfully built for user {user.id}")
        return DashboardData(**data)

    async def _get_user_data(self, user: AuthenticatedUser):
        row = await get_user_service(db=self._db).get_user_by_id(user.id)
        return UserDetail.model_validate(row)

    async def _get_summary(self, user: AuthenticatedUser):
        return await SummaryService.get_user_summary(user, self._db, self._redis)

    async def _get_targets(self, user: AuthenticatedUser):
        return await SummaryService.get_user_targets(user, self._db, self._redis)

    async def _get_groups(self, user: AuthenticatedUser):
        from src.domains.cooperatives.schemas import CooperativeRead
        from src.domains.dashboard.schemas import ExploreGroups

        service = CooperativeService(UnitOfWork(self._db))
        user_groups = await service.get_for_user(user.id)

        # Discovery has its own listing. Pulling the whole catalog here held
        # the wallet balance and the member's cooperatives on the home page.
        return ExploreGroups(
            user_groups=[
                CooperativeRead.model_validate(g).model_dump(mode="json")
                for g in user_groups
            ],
            suggested_groups=[],
        )

    async def _get_activities(self, user: AuthenticatedUser):
        return await ActivityService.get_user_recent_activities(
            self._db, user, self._redis
        )

    async def _get_ai_insights(self, user: AuthenticatedUser):
        return await InsightEngine.get_user_insights(
            self._db, user, self._redis, skip=0, limit=10, generate=False
        )

    async def _get_notifications(self, user: AuthenticatedUser):
        return await NotificationService.get_user_unread_notifications(
            user, self._db, self._redis
        )

    async def _get_cooperative_members(self, user: AuthenticatedUser):
        return await CooperativeMembershipService.get_top_memberships(
            self._db, user, skip=0, limit=20
        )
