from datetime import datetime
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from redis import Redis
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List


from app.core.dependencies import get_redis
from app.schemas.ai_insight_schema import AIInsightDetail
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
    redis: Redis = Depends(get_redis)
):
    

    insight = await InsightEngine.get_ai_insights(
        db,
        current_user, 
        redis

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

   
