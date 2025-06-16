from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, WebSocket
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Annotated, List

from app.api.v1.routes.auth import get_current_user
from app.schemas.support_schemas import FeedbackCreate, FeedbackDetail
from app.services.support_service import SupportService
from app.schemas.auth import AuthenticatedUser
from app.schemas.notifications_schema import NotificationCreate
from app.schemas.user import AuthUser, UserCreate
from app.services.notification_service import NotificationService
from db.dependencies import get_async_db_session
from app.services.auth_service import AuthService

router = APIRouter(
    prefix="/api/v1/support", 
    tags=["Support, Feedback & Reviews"]
    )

@router.post("/write-us")
async def write_us_a_feedback(
    feedback_data: FeedbackCreate,
    db: AsyncSession = Depends(get_async_db_session)
) -> FeedbackDetail:
    feedback = await SupportService.give_feedback(feedback_data, db)


    return feedback


@router.get("/",  response_model=List[FeedbackDetail])
async def get_feedbacks(
        db: AsyncSession = Depends(get_async_db_session),
        user: AuthenticatedUser = Depends(get_current_user),
        skip: int = 0,
        limit: int =10
        ):
    
    feedbacks = await SupportService.get_feedbacks(db, skip, limit)

    return feedbacks


