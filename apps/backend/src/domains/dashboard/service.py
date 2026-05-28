from sqlalchemy.ext.asyncio import AsyncSession
from redis.asyncio import Redis


from apps.backend.src.domains.auth.schemas import AuthenticatedUser
from apps.backend.src.domains.dashboard.schemas import DashboardData
from apps.backend.src.shared.utils.logger import logger

from apps.backend.src.domains.circles.service import CooperativeGroupService
from apps.backend.src.domains.analytics.service import ActivityService
from apps.backend.src.domains.insights.service import InsightEngine
from apps.backend.src.domains.notifications.notification_service import NotificationService
from apps.backend.src.domains.memberships.service import CooperativeMembershipService
from apps.backend.src.domains.analytics.summary_service import SummaryService
from apps.backend.src.domains.users.service import UserService


class DashboardService:

    @staticmethod
    async def get_dashboard_data(
        db: AsyncSession, redis: Redis, user: AuthenticatedUser
    ):  # DashboardData:
        """
        Aggregates all personalized user data into a unified dashboard view.
        """

        logger.info(f"\n\nBuilding dashboard for user {user.id}\n\n")

        user_data = await UserService.get_user_by_id(db, user.id)
        summary = await SummaryService.get_user_summary(user, db, redis)
        targets =  await SummaryService.get_user_targets(user, db, redis)
        groups =  await CooperativeGroupService.get_user_and_suggested_groups(
            user, db, redis
        )
        activities = await ActivityService.get_user_recent_activities(db, user, redis)
        ai_insights = await InsightEngine.get_user_insights(
            db, user, redis, skip=0, limit=10
        )
        notifications = await NotificationService.get_user_unread_notifications(
            user, db, redis
        )
        cooperative_members = await CooperativeMembershipService.get_top_memberships(
            db, user, skip=0, limit=20
        )

        logger.info(f"Dashboard successfully built for user {user_data}")

        return DashboardData(
            user=user_data,
            summary=summary,
            targets=targets,
            groups=groups,
            activities=activities,
            ai_insights=ai_insights,
            notifications=notifications,
            cooperative_members=cooperative_members,
        )
