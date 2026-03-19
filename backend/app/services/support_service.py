from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status

from app.schemas.support_schemas import FeedbackCreate, FeedbackDetail
from db.models.feedback_model import Feedback
from app.utils.logger import logger


class SupportService:

    @staticmethod
    async def give_feedback(
        feedback_data: FeedbackCreate, db: AsyncSession
    ) -> FeedbackDetail:
        """ """
        try:
            new_feedback = Feedback(
                full_name=feedback_data.full_name,
                email=feedback_data.email,
                subject=feedback_data.subject,
                message=feedback_data.message,
            )

            db.add(new_feedback)
            await db.commit()
            await db.refresh(new_feedback)
            return new_feedback

        except Exception as e:
            logger.error(f"Feedback creation failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not record feedback",
            )

    @staticmethod
    async def get_feedbacks(
        db: AsyncSession, skip: int = 0, limit: int = 10
    ) -> list[FeedbackDetail]:
        """
        Fetch a list of feedback/reviews made by users
        """
        try:
            result = await db.execute(select(Feedback).offset(skip).limit(limit))
            feedbacks = result.scalars().all()
        except Exception as e:
            logger.error(f"Failed to fetch feedbacks: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not fetch feedback",
            )
        return feedbacks
