from fastapi import APIRouter, Depends
from redis import Redis
import requests
from sqlalchemy.ext.asyncio import AsyncSession

from config import AppConfig as config
from app.utils.logger import logger
from app.core.dependencies import get_redis
from app.services.insights_service import InsightEngine
from app.routers.v1.auth import get_current_user
from app.schemas.auth import AuthenticatedUser
from db.dependencies import get_async_db_session
from app.utils.logger import logger


router = APIRouter(prefix="/api/v1/insights", tags=["Insights"])


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
    db: AsyncSession = Depends(get_async_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
    prompt: str = "",
    redis_client: Redis = Depends(get_redis),
):
    whole_prompt = f"""
        You are CoopWise AI assistant. An AI financial assitant working for a cooperative savings app in Nigeria.
        That helps with savings and financial advices and insights


        Provide a helpful, useful and very concise response for this user's message to advice their need

        Message: {prompt}
    """
    try:
        response = await ask_google_llm(whole_prompt)
    except Exception as e:
        # Never leak upstream details (or API keys) to clients.
        logger.error(f"AI chat failed: {e}")
        msg = str(e) if e else ""
        if "rate limited" in msg.lower():
            response = "AI is temporarily rate-limited. Please try again in a minute."
        else:
            response = "Something happened. Please try again."

    return response


async def ask_google_llm(prompt: str):
    logger.info(f"\n\n Prompt: {prompt}\n\n")
    # Step 2: Prepare request payload
    payload = {"contents": [{"parts": [{"text": prompt}]}]}

    # Step 3: Make POST request to Gemini API
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={config.GEMINI_API_KEY}"

    try:
        # Retry transient upstream errors (esp. 429) a couple times.
        last_status: int | None = None
        for attempt in range(3):
            response = requests.post(
                url, headers={"Content-Type": "application/json"}, json=payload, timeout=15
            )
            last_status = response.status_code
            if response.status_code == 429:
                # Backoff: 0.5s, 1.0s then give up
                import time

                time.sleep(0.5 * (attempt + 1))
                continue
            response.raise_for_status()
            break
        else:
            raise RuntimeError("AI is rate limited")

        data = response.json()
        insight_text = data["candidates"][0]["content"]["parts"][0]["text"]
        return insight_text

    except requests.RequestException as e:
        # Do not include the full exception string, which may contain the request URL (and API key).
        if getattr(e, "response", None) is not None and e.response is not None:
            if e.response.status_code == 429:
                raise RuntimeError("AI is rate limited")
        raise RuntimeError("Failed to fetch AI insight")

    except (KeyError, IndexError) as e:
        raise RuntimeError(f"Unexpected Gemini response format: {e}")
