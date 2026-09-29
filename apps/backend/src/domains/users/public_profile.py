from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domains.contributions.models import Contribution, ContributionStatus
from src.domains.memberships.models.enums import MembershipStatus
from src.domains.memberships.models.group_membership import GroupMembership
from src.domains.users.exceptions import UserNotFoundError
from src.domains.users.models import User
from src.domains.users.schemas import PublicProfile


async def get_public_profile(db: AsyncSession, user_id: UUID) -> PublicProfile:
    user = await db.get(User, user_id)
    if not user:
        raise UserNotFoundError("User not found")

    active_groups = await db.scalar(
        select(func.count())
        .select_from(GroupMembership)
        .where(
            GroupMembership.user_id == user_id,
            GroupMembership.status == MembershipStatus.ACTIVE,
        )
    )
    completed = await db.scalar(
        select(func.count())
        .select_from(Contribution)
        .where(
            Contribution.user_id == user_id,
            Contribution.status == ContributionStatus.completed,
        )
    )

    return PublicProfile(
        id=user.id,
        username=user.username,
        full_name=user.full_name,
        profile_picture_url=user.profile_picture_url,
        is_kyc_verified=bool(user.is_kyc_verified),
        member_since=user.created_at,
        active_groups_count=active_groups or 0,
        completed_contributions_count=completed or 0,
    )
