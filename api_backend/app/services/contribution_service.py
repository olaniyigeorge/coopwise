# Log contributions manually/automatically.

# Validate against group rules (amount, schedule).

# Calculate group savings status.

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.schemas.contribution_schemas import ContributionCreate, ContributionDetail
from app.services.membership_service import CooperativeMembershipService
from app.schemas.auth import AuthenticatedUser
from db.models.contribution_model import Contribution
from app.utils.logger import logger
from app.core.config import config
from fastapi import HTTPException, status


class ContributionService:


    @staticmethod
    async def make_contribution(contribution_data: ContributionCreate, user:AuthenticatedUser, db: AsyncSession) -> ContributionDetail:
        """
        Makes a contribution to a cooperative group. 
        """

        # Check if user is a member of the cooperative group
        membership = await CooperativeMembershipService.get_membership_by_user_and_group(
            user_id=user.id, group_id=contribution_data.group_id, db=db
        )
        
        if not membership:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not a member of this cooperative group."
            )

        # Create contribution record
        contribution = Contribution(
            group_id=contribution_data.group_id,
            user_id=user.id,
            amount=contribution_data.amount,
            currency=contribution_data.currency,
            due_date=contribution_data.due_date or None,
            note=contribution_data.note or None,
            status=contribution_data.status,
           
        )

        db.add(contribution)
        await db.commit()
        await db.refresh(contribution)

        logger.info(f"Contribution made successfully: {contribution}")

        return contribution








