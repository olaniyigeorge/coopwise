from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from src.api.middlewares.dependencies import get_current_user
from src.domains.support.schemas import FeedbackCreate, FeedbackDetail
from src.domains.support.service import SupportService
from src.domains.auth.schemas import AuthenticatedUser
from src.infra.db.dependencies import get_async_db_session

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
