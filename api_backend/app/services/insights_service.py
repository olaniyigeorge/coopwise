from typing import List
from redis import Redis
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas.ai_insight_schema import AIInsightDetail
from app.schemas.dashboard_schema import DashboardData
from app.schemas.auth import AuthenticatedUser
# from app.services.insight_service import InsightService
from app.services.notification_service import NotificationService
from app.utils.cache import get_cache, update_cache
from app.utils.llm_client import ask_llm
from fastapi import HTTPException, status
import json
from app.utils.logger import logger
from db.models.ai_insight import AIInsight


class InsightEngine:
    @staticmethod
    async def save_user_insight(user_id: str, insight: dict, db: AsyncSession):
        """
        Saves a structured AI insight to the database.
        """
        pass


  
    @staticmethod
    async def get_user_insights(
        db: AsyncSession,
        user: AuthenticatedUser,
        redis: Redis,
        skip: int = 0,
        limit: int = 10
    ) -> List[AIInsightDetail]:
        cache_key = f"insights:{user.id}:skip:{skip}:limit:{limit}"
        cached = await get_cache(cache_key)
        if cached:
            logger.info(f"🔄 Using cached AI insights for user {user.id} (skip={skip}, limit={limit})")
            return [AIInsightDetail.model_validate(item) for item in cached]

        logger.info(f"Fetching AI insights for user {user.id} from database (skip={skip}, limit={limit})")

        try:
            stmt = (
                select(AIInsight)
                .where(AIInsight.user_id == user.id)
                .order_by(AIInsight.created_at.desc())
                .offset(skip)
                .limit(limit)
            )
            result = await db.execute(stmt)
            insights = result.scalars().all()

            serialized = [AIInsightDetail.model_validate(i) for i in insights]

            await update_cache(cache_key, serialized, ttl=300)
            return [AIInsightDetail.model_validate(i) for i in serialized]

        except Exception as e:
            logger.logger.error(e)
            raise e

    @staticmethod
    async def generate_and_store_insights(user: AuthenticatedUser, dashboard_data: DashboardData, db: AsyncSession) -> None:
        """
        Uses LLM to generate insights from dashboard data.
        Notifies the user + announces to all users.
        """
        prompt = await InsightEngine.build_prompt(user, dashboard_data)

        try:
            response = await ask_llm(prompt)
            insights = await InsightEngine.parse_insight_response(response)
        except Exception as e:
            logger.error(f"LLM insight generation failed: {e}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Insight generation failed.")

        for insight_data in insights:
            structured = insight_data["insight"]
            saved_insight = await InsightEngine.save_user_insight(user.id, structured, db)

            # Notify the owner
            await NotificationService.push_notification(
                user_id=user.id,
                title="📊 New AI Insight Just for You",
                message=structured["title"],
                payload={"insight_id": saved_insight.id},
                db=db
            )

            # Notify everyone anonymously
            await NotificationService.broadcast_notification(
                title="📢 AI Insight Generated",
                message="A new insight was generated for a CoopWise user. Stay active to unlock yours!",
                payload={"anonymous": True},
                db=db
            )

    @staticmethod
    def build_prompt(user: AuthenticatedUser, data: DashboardData) -> str:
        return f"""
            You are an AI insight generator working for a cooperative savings app in Nigeria.

            Generate 2 meaningful financial or behavioral insights using IDENTIC format for this user. Each insight should be structured like this:

            {{
            "insight": {{
                "title": "<title>",
                "description": "<description>",
                "priority": "high | medium | low",
                "category": "contribution | savings | behavior | group",
                "source": "AI",
                "format": "IDENTIC"
            }}
            }}

            DASHBOARD DATA:
            Summary: {data.summary}
            Targets: {data.targets}
            Groups: {data.groups}
            Activities: {data.activities}
            Existing Insights: {data.ai_insights}

            DO NOT mention user name or PII.
            Only return a JSON list of 2 insights in the above structure.
        """

    @staticmethod
    def parse_insight_response(response: str) -> list[dict]:
        try:
            insights = json.loads(response)
            if isinstance(insights, list):
                return insights
            raise ValueError("Response is not a list")
        except Exception as e:
            logger.error(f"Invalid insight response format: {e}")
            return []
