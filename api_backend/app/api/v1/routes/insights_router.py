from fastapi import APIRouter, Depends
from redis import Redis
import requests
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import config
from app.core.dependencies import get_redis
from app.services.insights_service import InsightEngine
from app.api.v1.routes.auth import get_current_user
from app.schemas.auth import AuthenticatedUser
from db.dependencies import get_async_db_session
from app.utils.logger import logger


router = APIRouter(
    prefix="/api/v1/insights",
    tags=["Insights"]
)

@router.get("/", summary="Get Insights")
async def get_mock_insights(
    db: AsyncSession = Depends(get_async_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
    margin: int = 4
):
    

    insight = await InsightEngine.mock_generate_insight_for_user_if_necessary(
        db,
        current_user, 
        margin
    )
    
    print(f"\n Insight: {insight}\n")

 
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
    prompt: str ="",
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
        response = f"Something happened. Please try again {e}"
    
    return response
   




async def ask_google_llm(prompt: str):
    print(f"\n\n Prompt: {prompt}\n\n")
    # Step 2: Prepare request payload
    payload = {
        "contents": [
            {
                "parts": [{"text": prompt}]
            }
        ]
    }

    # Step 3: Make POST request to Gemini API
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={config.GEMINI_API_KEY}"

    try:
        response = requests.post(
            url,
            headers={"Content-Type": "application/json"},
            json=payload,
            timeout=10
        )
        response.raise_for_status()

        data = response.json()
        print(f"\n\n ->GOOGLE JSON response {data} GOOGLE JSON response<- \n\n")
        insight_text = data["candidates"][0]["content"]["parts"][0]["text"]
        return insight_text

    except requests.RequestException as e:
        raise RuntimeError(f"Failed to fetch AI insight: {e}")

    except (KeyError, IndexError) as e:
        raise RuntimeError(f"Unexpected Gemini response format: {e}")
    

