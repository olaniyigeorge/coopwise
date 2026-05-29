from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, WebSocket
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Annotated, List

from src.api.middlewares.dependencies import get_current_user
from src.domains.support.schemas import FeedbackCreate, FeedbackDetail
from src.domains.support.service import SupportService
from src.domains.auth.schemas import AuthenticatedUser
from src.domains.notifications.schemas import NotificationCreate
from src.domains.users.schemas import AuthUser, UserCreate
from src.domains.notifications.service import NotificationService
from src.infra.db.dependencies import get_async_db_session
from src.domains.auth.service import AuthService

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
