from datetime import datetime, timedelta
import random
from typing import List, Union
from pydantic import ValidationError
from redis import Redis
import requests
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas.user import UserDetail
from app.services.activity_service import ActivityService
from app.core.config import config
from app.schemas.activity_schemas import ActivityDetail
from app.services.user_service import UserService
from app.schemas.ai_insight_schema import (
    AI_INSIGHT_TEMPLATES,
    AIInsightCreate,
    AIInsightDetail,
    InsightMetadata,
)
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

import re


class InsightEngine:

    @staticmethod
    async def save_user_insight(user_id: str, insight: dict, db: AsyncSession):
        """
        Saves a structured AI insight to the database.
        """
        pass

    @staticmethod
    async def get_my_insights(
        db: AsyncSession, skip: int = 0, limit: int = 10
    ) -> List[AIInsightDetail]:
        try:
            result = await db.execute(select(AIInsight).offset(skip).limit(limit))
            insights = result.scalars().all()
        except Exception as e:
            logger.error(f"Failed to fetch insights: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not fetch insights",
            )
        return insights

    @staticmethod
    async def get_user_insights(
        db: AsyncSession,
        user: AuthenticatedUser,
        redis: Redis,
        skip: int = 0,
        limit: int = 10,
    ) -> List[AIInsightDetail]:
        cache_key = f"insights:{user.id}:skip:{skip}:limit:{limit}"
        cached = await get_cache(cache_key)
        if cached:
            logger.info(
                f"🔄 Using cached AI insights for user {user.id} (skip={skip}, limit={limit})"
            )
            # Deserialize if values are strings
            deserialized = [
                json.loads(item) if isinstance(item, str) else item for item in cached
            ]
            return [AIInsightDetail.model_validate(item) for item in deserialized]

        logger.info(
            f"📬 Fetching AI insights for user {user.id} from database (skip={skip}, limit={limit})"
        )

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

            if insights[-1].created_at < (datetime.now() - timedelta(hours=12)):
                logger.info(
                    f"🔄 No recent insights for user {user.id}, generating new one"
                )
                # Generate new insights if none in the last 12 hours- TODO Update this to generate inteli
                await InsightEngine.get_save_new_insight(db, user, redis)
                result = await db.execute(stmt)
                insights = result.scalars().all()

            logger.info(f"\n\n Raw Insights: {insights}\n\n")
            validated_insights = [
                AIInsightDetail.model_validate(insight, from_attributes=True)
                for insight in insights
            ]
            serialized = [
                json.dumps(AIInsightDetail.model_validate(i).model_dump(mode="json"))
                for i in validated_insights
            ]

            await update_cache(cache_key, serialized, ttl=600)
            return [AIInsightDetail.model_validate(json.loads(i)) for i in serialized]

        except Exception as e:
            logger.error(e)
            raise e

    @staticmethod
    async def get_save_new_insight(
        db: AsyncSession, user: AuthenticatedUser, redis: Redis
    ):
        logger.info(f"\n\n creating and saving new insight....... \n\n")
        try:
            insight = await InsightEngine.get_ai_insight(db, user, redis)
        except Exception:
            logger.info(
                "Oops!! Couldn't generate AI insights for now. Try again later."
            )
            return {
                "status": 400,
                "message": "Oops!! Couldn't generate AI insights for now. Try again later.",
                "insights": [],
            }

        insight = await clean_ai_insight_response(insight)

        logger.info(f"\nInsight raw response: {insight}\n")

        try:
            logger.info(f"\nParsing AI insight... type: {type(insight)}\n")
            insight_data = await parse_ai_insight(insight)
        except Exception as e:
            logger.info(f"❌ Error formatting AI insight: {e}")
            insight_data = None

        created_insights = []
        if insight_data:
            logger.info("\nSaving AI insight to DB...\n")
            try:
                for ins in insight_data:
                    cr: AIInsightDetail = await InsightEngine.create_ai_insight(
                        ins, db, user
                    )
                    created_insights.append(cr)
            except Exception as e:
                logger.info(f"Could not create AI insight: {e}")

        if created_insights:
            return {
                "message": "Insight generated successfully.",
                "insights": created_insights,
            }
        else:
            return {
                "message": "Oops! Try requesting insights later.",
                "insights": [],
            }

    @staticmethod
    async def generate_and_store_insights(
        user: AuthenticatedUser, dashboard_data: DashboardData, db: AsyncSession
    ) -> None:
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
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Insight generation failed.",
            )

        for insight_data in insights:
            structured = insight_data["insight"]
            saved_insight = await InsightEngine.save_user_insight(
                user.id, structured, db
            )

            # Notify the owner
            await NotificationService.push_notification_to_user(
                user_id=user.id,
                title="📊 New AI Insight Just for You",
                message=structured["title"],
                payload={"insight_id": saved_insight.id},
                db=db,
            )

            # Notify everyone anonymously
            await NotificationService.broadcast_notification(
                title="📢 AI Insight Generated",
                message="A new insight was generated for a CoopWise user. Stay active to unlock yours!",
                payload={"anonymous": True},
                db=db,
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
    async def create_ai_insight(
        ai_insight_data: AIInsightCreate, db: AsyncSession, user: AuthenticatedUser
    ) -> AIInsightDetail:
        try:
            new_ai_insight = AIInsight(
                title=ai_insight_data.title,
                description=ai_insight_data.description,
                summary=ai_insight_data.summary,
                recommended_action=ai_insight_data.recommended_action,
                user_id=user.id,
                group_id=None,
                category=ai_insight_data.category,
                type=ai_insight_data.type,
                difficulty=ai_insight_data.difficulty,
                status=ai_insight_data.status,
                estimated_savings=ai_insight_data.estimated_savings,
                potential_gain=ai_insight_data.potential_gain,
                impact_score=ai_insight_data.impact_score,
                tags=ai_insight_data.tags,
                timeframe=ai_insight_data.timeframe,
                implementation_time=ai_insight_data.implementation_time,
                insight_metadata=ai_insight_data.insight_metadata.model_dump(),
            )
            db.add(new_ai_insight)
            await db.commit()
            await db.refresh(new_ai_insight)
        except Exception as e:
            logger.error(e)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Could not create ai_insight - {str(e)}",
            )
        return AIInsightDetail.model_validate(new_ai_insight, from_attributes=True)

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

    @staticmethod
    async def mock_generate_insight_for_user_if_necessary(
        db: AsyncSession, user: AuthenticatedUser, margin: int = 4
    ):
        guess = random.randint(0, 10)
        logger.info(f"\n Guess {guess} -->-- Margin {margin} == {guess > margin}\n")
        if guess > margin:
            logger.info(f"\nGenerating insight for user-{user.id}\n")
            insight = await InsightEngine.mock_generate_ai_insight(db, user)
            return insight
        return None

    @staticmethod
    async def mock_generate_ai_insight(
        db: AsyncSession, user: AuthenticatedUser
    ) -> AIInsightDetail | None:

        user = await UserService.get_user_by_id(db, user.id)

        template = random.choice(AI_INSIGHT_TEMPLATES)

        metadata = InsightMetadata(
            success_rate=random.randint(60, 95),
            users_implemented=random.randint(10, 200),
            average_time_to_complete=template.get("implementation_time"),
            prerequisites=["Register", "Create Profile"],
            related_insights=["Set a Goal", "Make First Contribution"],
            source="MockGen",
        )

        aiins = AIInsightCreate(
            user_id=user.id,
            group_id=None,
            title=template["title"],
            description=template.get("summary"),
            summary=template["summary"],
            recommended_action=template.get("recommended_action"),
            category=template["category"],
            type=template["type"],
            difficulty=template["difficulty"],
            status=template["status"],
            estimated_savings=template["estimated_savings"],
            potential_gain=template["potential_gain"],
            impact_score=template["impact_score"],
            tags=template["tags"],
            timeframe=template.get("timeframe"),
            implementation_time=template.get("implementation_time"),
            insight_metadata=metadata,
        )

        new_ins = AIInsight(
            user_id=aiins.user_id,
            group_id=None,
            title=aiins.title,
            description=aiins.description,
            summary=aiins.summary,
            recommended_action=aiins.recommended_action,
            category=aiins.category,
            type=aiins.type,
            difficulty=aiins.difficulty,
            status=aiins.status,
            estimated_savings=aiins.estimated_savings,
            potential_gain=aiins.potential_gain,
            impact_score=aiins.impact_score,
            tags=aiins.tags,
            timeframe=aiins.timeframe,
            implementation_time=aiins.implementation_time,
        )

        logger.info(f"\n{new_ins}\n")

        db.add(new_ins)
        await db.commit()
        await db.refresh(new_ins)

        # # Convert to Pydantic schema
        # notification_detail = AIInsightDetail.model_validate(new_ins)

        # # Push notification to user via WebSocket
        # await NotificationService.push_notification_to_user(new_ins.user_id, notification_detail)
        return AIInsightDetail.model_validate(new_ins)

    @staticmethod
    async def get_ai_insight(db: AsyncSession, user: AuthenticatedUser, redis: Redis):
        if not config.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY is not set in environment variables")

        user = await UserService.get_user_by_id(db, user.id)
        activities = await ActivityService.get_user_recent_activities(db, user, redis)
        # Step 1: Build prompt from activity logs
        prompt = await InsightEngine.build_ai_insight_prompt(user, activities)

        logger.info(f"\n\n Prompt: {prompt}\n\n")
        # Step 2: Prepare request payload
        payload = {"contents": [{"parts": [{"text": prompt}]}]}

        # Step 3: Make POST request to Gemini API
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={config.GEMINI_API_KEY}"

        try:
            response = requests.post(
                url,
                headers={"Content-Type": "application/json"},
                json=payload,
                timeout=10,
            )
            response.raise_for_status()

            data = response.json()
            logger.info(
                f"\n\n ->GOOGLE JSON response {data} GOOGLE JSON response<- \n\n"
            )
            insight_text = data["candidates"][0]["content"]["parts"][0]["text"]
            return insight_text

        except requests.RequestException as e:
            raise RuntimeError(f"Failed to fetch AI insight: {e}")

        except (KeyError, IndexError) as e:
            raise RuntimeError(f"Unexpected Gemini response format: {e}")

    @staticmethod
    async def build_ai_insight_prompt(
        user: UserDetail, activities: List[ActivityDetail]
    ) -> str:
        activity_lines = "\n".join(
            f"- [{act.created_at.date()}] {act.type.name.replace('_', ' ').title()}: {act.description}"
            for act in activities
        )

        return f"""
            You are an AI Insight Assistant helping users improve their savings behavior on a cooperative savings platform in Africa.

            User Profile:
            - Full Name: {user.full_name}
            - Email: {user.email}
            - Phone: {user.phone_number}
            - Role: {user.role}
            - Verified Email: {user.is_email_verified}
            - Verified Phone: {user.is_phone_verified}
            - Target Savings Amount: {user.target_savings_amount}
            - Savings Purpose: {user.savings_purpose}
            - Income Range: {user.income_range}
            - Saving Frequency: {user.saving_frequency}

            Recent Activity:
            {activity_lines}

            Generate 1 insight in this exact JSON format for the user to help them improve savings or group engagement. Each insight must follow this structure (use realistic values):

            {{
            "title": "Descriptive title of the insight",
            "summary": "Short summary of the insight",
            "description": "Detailed explanation of the insight",
            "recommended_action": "Suggested user action to improve behavior",
            "category": "contribution | savings | behavior | group | milestone | energy_saving | financial_optimization | contribution_strategy | spending_analysis | investment_tips | budgeting | goal_setting | other",
            "type": "personal | group_specific | general | trending",
            "difficulty": "easy | medium | hard",
            "status": "not_started | in_progress | completed | dismissed",
            "estimated_savings": 1500.0,
            "potential_gain": 2000.0,
            "impact_score": 7.5,
            "tags": ["group", "payout", "engagement"],
            "timeframe": "1 month",
            "implementation_time": 2.5,
            "insight_metadata": {{
                "source": "AI Engine",
                "success_rate": 0.92,
                "users_implemented": 250,
                "average_time_to_complete": 200.5,
                "prerequisites": ["an account", "some funds"],
                "related_insights": ["00000", "hbie222"],
                "confidence_score": 0.92
            }}
            }}

            ONLY RETURN THE INSIGHT AS A JSON OBJECT.
        """


async def parse_ai_insight(json_response: Union[str, dict]) -> List[AIInsightCreate]:
    try:
        if isinstance(json_response, str):
            data = json.loads(json_response)
        elif isinstance(json_response, dict):
            data = json_response
        else:
            raise ValueError(f"Unexpected type for insights: {type(json_response)}")

        logger.info(f"\nParsed data type: {type(data)}\nParsed data: {data}\n")

        # Validate and return as a single-item list
        return [AIInsightCreate.model_validate(data)]
    except ValidationError as e:
        raise ValueError(f"Invalid AI insight format: {e}")
    except json.JSONDecodeError as e:
        raise ValueError(f"Failed to decode JSON from insights response: {e}")


async def clean_ai_insight_response(raw_str: str) -> str:
    """
    Remove markdown-style code block wrappers like ```json ... ``` or ```
    """
    # Remove triple backticks with optional language tag
    cleaned = re.sub(
        r"^```(?:json)?\s*|\s*```$", "", raw_str.strip(), flags=re.IGNORECASE
    )
    return cleaned
