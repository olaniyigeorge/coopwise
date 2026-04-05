from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from redis import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.utils.logger import logger
from app.core.dependencies import get_redis
from app.services.insights_service import InsightEngine
from app.services.ai_chat_store import clear_messages, load_messages, save_messages
from app.routers.v1.auth import get_current_user
from app.schemas.auth import AuthenticatedUser
from db.dependencies import get_async_db_session
from app.utils.openai_chat import openai_chat_with_messages


router = APIRouter(prefix="/api/v1/insights", tags=["Insights"])

AI_CHAT_SYSTEM = (
    "You are CoopWise AI assistant, a concise financial helper for a cooperative "
    "savings app in Nigeria. Focus on savings, budgeting, and group savings behavior."
)
MAX_HISTORY_MESSAGES = 40  # cap prior turns sent to the model (user+assistant pairs)


class AiChatBody(BaseModel):
    prompt: str = Field(..., min_length=1)


class AiChatHistoryResponse(BaseModel):
    messages: list[dict]


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


@router.get("/get-ai_insight", summary="Get AI Insight")
async def get_insight(
    db: AsyncSession = Depends(get_async_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
    redis_client: Redis = Depends(get_redis),
):
    return await InsightEngine.get_save_new_insight(db, current_user, redis_client)


@router.get("/ai-chat/history", response_model=AiChatHistoryResponse)
async def get_ai_chat_history(
    current_user: AuthenticatedUser = Depends(get_current_user),
    redis_client: Redis = Depends(get_redis),
):
    uid = str(current_user.id)
    return AiChatHistoryResponse(messages=load_messages(redis_client, uid))


@router.delete("/ai-chat/history")
async def delete_ai_chat_history(
    current_user: AuthenticatedUser = Depends(get_current_user),
    redis_client: Redis = Depends(get_redis),
):
    clear_messages(redis_client, str(current_user.id))
    return {"ok": True}


@router.post("/ai-chat", summary="Chat with AI Assistant")
async def get_immediate_ai_response(
    body: AiChatBody,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
    redis_client: Redis = Depends(get_redis),
):
    _ = db
    uid = str(current_user.id)
    history = load_messages(redis_client, uid)

    api_messages: list[dict[str, str]] = [{"role": "system", "content": AI_CHAT_SYSTEM}]
    recent = history[-MAX_HISTORY_MESSAGES:] if len(history) > MAX_HISTORY_MESSAGES else history
    for m in recent:
        role = m.get("role")
        content = (m.get("content") or "").strip()
        if role in ("user", "assistant") and content:
            api_messages.append({"role": role, "content": content})

    user_line = (
        "Provide a helpful, useful, and very concise reply to the user's message.\n\n"
        f"Message: {body.prompt}"
    )
    api_messages.append({"role": "user", "content": user_line})

    try:
        response = await openai_chat_with_messages(
            api_messages,
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

    ts = datetime.now(timezone.utc).isoformat()
    history.append({"role": "user", "content": body.prompt, "ts": ts})
    history.append({"role": "assistant", "content": response, "ts": ts})
    save_messages(redis_client, uid, history)

    return response
