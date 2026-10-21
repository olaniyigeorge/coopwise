from fastapi import APIRouter, Depends
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel
from redis import Redis
import requests
from sqlalchemy.ext.asyncio import AsyncSession

from config import AppConfig as config
from src.shared.utils.logger import logger
from src.infra.cache.redis_client import get_redis
from src.domains.insights.service import InsightEngine
from src.api.middlewares.dependencies import get_current_user
from src.domains.auth.schemas import AuthenticatedUser
from src.infra.db.dependencies import get_async_db_session


router = APIRouter(prefix="/api/v1/insights", tags=["Insights"])


class AIChatRequest(BaseModel):
    prompt: str = ""


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
    payload: AIChatRequest,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
    redis_client: Redis = Depends(get_redis),
):
    prompt = payload.prompt.strip()
    if not prompt:
        return PlainTextResponse(
            "Send a message and I’ll help with your cooperative savings."
        )

    whole_prompt = f"""
        You are CoopWise AI assistant. An AI financial assitant working for a cooperative savings app in Nigeria.
        That helps with savings and financial advices and insights


        Provide a helpful, useful and very concise response for this user's message to advice their need

        Message: {prompt}
    """
    try:
        response = await ask_assistant(whole_prompt)
    except Exception as e:
        # Never leak upstream details (or API keys) to clients.
        logger.error(f"AI chat failed: {type(e).__name__}")
        response = "Something happened. Please try again."

    return PlainTextResponse(response)


async def ask_assistant(prompt: str) -> str:
    """
    Chat completion through the Anthropic-compatible gateway.
    Falls back to Gemini when the gateway token is not configured.
    """
    token = (config.ANTHROPIC_AUTH_TOKEN or "").strip()
    if not token:
        return await ask_google_llm(prompt)

    url = f"{config.ANTHROPIC_BASE_URL.rstrip('/')}/v1/messages"
    payload = {
        "model": config.ANTHROPIC_MODEL or "deepseek-v4-flash",
        "max_tokens": 800,
        "messages": [{"role": "user", "content": prompt}],
    }
    headers = {
        "content-type": "application/json",
        "x-api-key": token,
        "authorization": f"Bearer {token}",
        "anthropic-version": "2023-06-01",
    }
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        response.raise_for_status()
        data = response.json()
    except requests.RequestException as exc:
        logger.error(f"AI gateway request failed: {type(exc).__name__}")
        raise RuntimeError("Failed to fetch AI response") from None

    content = data.get("content") if isinstance(data, dict) else None
    if isinstance(content, list):
        texts = [
            block.get("text", "")
            for block in content
            if isinstance(block, dict) and block.get("type") == "text"
        ]
        reply = "\n".join(part for part in texts if part).strip()
        if reply:
            return reply
    if isinstance(data, dict):
        choice = (data.get("choices") or [None])[0] or {}
        message = choice.get("message") or {}
        reply = (message.get("content") or data.get("text") or "").strip()
        if reply:
            return reply
    raise RuntimeError("Unexpected AI response format")


async def ask_google_llm(prompt: str):
    logger.info(f"\n\n Prompt: {prompt}\n\n")
    # Step 2: Prepare request payload
    payload = {"contents": [{"parts": [{"text": prompt}]}]}

    # Step 3: Make POST request to Gemini API
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={config.GEMINI_API_KEY}"

    try:
        response = requests.post(
            url, headers={"Content-Type": "application/json"}, json=payload, timeout=10
        )
        response.raise_for_status()

        data = response.json()
        logger.info(f"\n\n ->GOOGLE JSON response {data} GOOGLE JSON response<- \n\n")
        insight_text = data["candidates"][0]["content"]["parts"][0]["text"]
        return insight_text

    except requests.RequestException:
        # Do not include the full exception string, which may contain the request URL (and API key).
        raise RuntimeError("Failed to fetch AI insight")

    except (KeyError, IndexError) as e:
        raise RuntimeError(f"Unexpected Gemini response format: {e}")
