from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, WebSocket
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Annotated, List

from apps.backend.app.api.routers.v1.auth import get_current_user
from apps.backend.src.domains.support.schemas import FeedbackCreate, FeedbackDetail
from apps.backend.src.domains.support.service import SupportService
from apps.backend.src.domains.auth.schemas import AuthenticatedUser
from apps.backend.src.domains.notifications.schemas import NotificationCreate
from apps.backend.src.domains.users.schemas import AuthUser, UserCreate
from apps.backend.src.domains.notifications.notification_service import NotificationService
from apps.backend.src.coopwise_infra.db.dependencies import get_async_db_session
from apps.backend.src.domains.auth.service import AuthService

router = APIRouter(prefix="/api/v1/support", tags=["Support, Feedback & Reviews"])


@router.post("/write-us")
async def write_us_a_feedback(
    feedback_data: FeedbackCreate, db: AsyncSession = Depends(get_async_db_session)
) -> FeedbackDetail:
    feedback = await SupportService.give_feedback(feedback_data, db)

    return feedback


@router.get("/", response_model=List[FeedbackDetail])
async def get_feedbacks(
    db: AsyncSession = Depends(get_async_db_session),
    user: AuthenticatedUser = Depends(get_current_user),
    skip: int = 0,
    limit: int = 10,
):

    feedbacks = await SupportService.get_feedbacks(db, skip, limit)

    return feedbacks
