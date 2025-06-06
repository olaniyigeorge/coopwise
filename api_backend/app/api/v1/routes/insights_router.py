from datetime import datetime
import json
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from redis import Redis
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Union
from pydantic import ValidationError


from app.core.dependencies import get_redis
from app.schemas.ai_insight_schema import AIInsightCreate, AIInsightDetail
from app.services.insights_service import InsightEngine
from app.schemas.notifications_schema import NotificationCreate
from app.services.notification_service import NotificationService
from app.services.payment_service import PaymentService
from app.services.user_service import UserService
from app.schemas.contribution_schemas import ContributionCreate
from app.api.v1.routes.auth import get_current_user
from app.schemas.payments import PaymentCreate, PaystackPayload
from app.services.contribution_service import ContributionService
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
    
    print(f"\ Insight: {insight}\n")

 
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
async def get_insights(
    db: AsyncSession = Depends(get_async_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
    redis: Redis = Depends(get_redis),
):
    try:
        insight = await InsightEngine.get_ai_insight(db, current_user, redis)
    except Exception:
        print("Oops!! Couldn't generate AI insights for now. Try again later.")
        return {
            "status": 400,
            "message": "Oops!! Couldn't generate AI insights for now. Try again later.",
            "insights": [],
        }
    
    insight = await clean_ai_insight_response(insight)
    
    print(f"\nInsight raw response: {insight}\n")
    
    try:
        print(f"\nParsing AI insight... type: {type(insight)}\n")
        insight_data = await parse_ai_insight(insight)
    except Exception as e:
        print(f"❌ Error formatting AI insight: {e}")
        insight_data = None

    created_insights = []
    if insight_data:
        print("\nSaving AI insight to DB...\n")
        try:
            for ins in insight_data:
                cr: AIInsightDetail = await InsightEngine.create_ai_insight(ins, db, current_user)
                created_insights.append(cr)
        except Exception as e:
            print(f"Could not create AI insight: {e}")

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

   

async def parse_ai_insight(json_response: Union[str, dict]) -> List[AIInsightCreate]:
    try:
        if isinstance(json_response, str):
            data = json.loads(json_response)
        elif isinstance(json_response, dict):
            data = json_response
        else:
            raise ValueError(f"Unexpected type for insights: {type(json_response)}")
        
        print(f"\nParsed data type: {type(data)}\nParsed data: {data}\n")
        
        # Validate and return as a single-item list
        return [AIInsightCreate.model_validate(data)]
    except ValidationError as e:
        raise ValueError(f"Invalid AI insight format: {e}")
    except json.JSONDecodeError as e:
        raise ValueError(f"Failed to decode JSON from insights response: {e}")





import re

async def clean_ai_insight_response(raw_str: str) -> str:
    """
    Remove markdown-style code block wrappers like ```json ... ``` or ```
    """
    # Remove triple backticks with optional language tag
    cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw_str.strip(), flags=re.IGNORECASE)
    return cleaned