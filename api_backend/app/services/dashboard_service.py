import asyncio
from typing import Any
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.schemas.auth import AuthenticatedUser
from app.schemas.dashboard_schema import DashboardData, Summary, Targets, Activity, Notification
# from app.services.summary_service import SummaryService
# from app.services.target_service import TargetService
from app.services.cooperative_group_service import CooperativeGroupService
# from app.services.activity_service import ActivityService

from app.services.insights_service import InsightEngine
from app.services.notification_service import NotificationService
from app.services.membership_service import CooperativeMembershipService
from app.services.summary_service import SummaryService
from app.services.user_service import UserService
from app.utils.logger import logger
from redis.asyncio import Redis


class DashboardService:

    @staticmethod
    async def get_dashboard_data(
        db: AsyncSession,
        redis: Redis,
        user: AuthenticatedUser
    ): # DashboardData:
        """
        Aggregates all personalized user data into a unified dashboard view.
        """

        logger.info(f"\n\nBuilding dashboard for user {user.id}\n\n")

        user_data = await UserService.get_user_by_id(db, user.id)
        summary = await SummaryService.get_user_summary(user, db, redis)
        targets = await SummaryService.get_user_targets(user, db, redis)
        groups = await CooperativeGroupService.get_user_and_suggested_groups(user, db, redis)
        # activities = await ActivityService.get_recent_activities(user, db, redis)
        ai_insights = await InsightEngine.get_user_insights(db, user, redis, skip=0, limit=10)
        notifications = await NotificationService.get_user_notifications(user, db, redis)
        cooperative_members = await CooperativeMembershipService.get_top_memberships(db, user, skip=0, limit=20) 

        


        logger.info(f"Dashboard successfully built for user {user_data}")

        return {
            "user": user_data,
            "summary": summary,
            "targets": targets,
            "groups": groups,
            "notifications": notifications,
            "cooperative_members": cooperative_members,
            "ai_insights": ai_insights
        }
    
    
    # DashboardData(
    #         user=user_data,
    #         # summary=summary,
    #         # targets=targets,
    #         # groups=groups,
    #         # activities=activities,
    #         # aiInsights=ai_insights,
    #         # notifications=notifications,
    #         # cooperativeMembers=cooperative_members
    #     )
