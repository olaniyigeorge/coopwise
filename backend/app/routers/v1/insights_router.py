from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from redis import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.utils.logger import logger
from app.core.dependencies import get_redis
from app.services.insights_service import InsightEngine
from app.routers.v1.auth import get_current_user
from app.schemas.auth import AuthenticatedUser
from db.dependencies import get_async_db_session
from app.utils.openai_chat import openai_chat_completion


router = APIRouter(prefix="/api/v1/insights", tags=["Insights"])


class AiChatBody(BaseModel):
    prompt: str = Field(..., min_length=1)


@router.get("/", summary="Get Insights")
async def get_mock_insights(
    db: AsyncSession = Depends(get_async_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
    margin: int = 4,
):

    insight = await InsightEngine.mock_generate_insight_for_user_if_necessary(
        db, current_user, margin
    )

    logger.info(f"\n Insight: {insight}\n")

    if insight:
        return {
            "message": "Insight Generated successfully.",
            "insight": insight,
        }

    return {
        "message": "Oops! Try Requesting Insights Later.",
        "insight": insight,
    }


# @router.get("/me", summary="User AI Insights")
# async def get_my_insights(db: AsyncSession, skip:int=0, limit:int=10) -> List[AIInsightDetail]:
#     return await InsightEngine.get_my_insights(db, skip, limit)


@router.get("/get-ai_insight", summary="Get AI Insight")
async def get_insight(
    db: AsyncSession = Depends(get_async_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
    redis_client: Redis = Depends(get_redis),
):
    return await InsightEngine.get_save_new_insight(db, current_user, redis_client)


@router.post("/ai-chat", summary="Chat with AI Assistant")
async def get_immediate_ai_response(
    body: AiChatBody,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
    redis_client: Redis = Depends(get_redis),
):
    _ = db, current_user, redis_client
    system = (
        "You are CoopWise AI assistant, a concise financial helper for a cooperative "
        "savings app in Nigeria. Focus on savings, budgeting, and group savings behavior."
    )
    user_msg = (
        "Provide a helpful, useful, and very concise reply to the user's message.\n\n"
        f"Message: {body.prompt}"
    )
    try:
        response = await openai_chat_completion(
            user_msg,
            system_prompt=system,
            max_tokens=800,
            temperature=0.6,
        )
    except Exception as e:
        logger.error(f"AI chat failed: {e}")
        msg = str(e) if e else ""
        if "rate limited" in msg.lower():
            response = "AI is temporarily rate-limited. Please try again in a minute."
        else:
            response = "Something happened. Please try again."

    return response
