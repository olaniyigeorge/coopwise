from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domains.cooperatives.exceptions import CooperativeNotFoundError
from src.domains.cooperatives.models.cooperative import CoopCooperative
from src.domains.cooperatives.models.enums import CooperativeStatus
from src.domains.cooperatives.models.rules import (
    CoopFinancialRule,
    CoopMembershipRule,
)
from src.domains.cooperatives.schemas import CooperativeOrganizer, CooperativePreview
from src.domains.memberships.admission import AdmissionMode, get_policy
from src.domains.memberships.models.enums import MembershipStatus
from src.domains.memberships.models.group_membership import GroupMembership
from src.domains.users.models import User


async def get_cooperative_preview(
    db: AsyncSession, cooperative_id: UUID
) -> CooperativePreview:
    coop = await db.get(CoopCooperative, cooperative_id)
    if coop is None or coop.status == CooperativeStatus.DELETED:
        raise CooperativeNotFoundError(str(cooperative_id))

    member_count = await db.scalar(
        select(func.count())
        .select_from(GroupMembership)
        .where(
            GroupMembership.group_id == coop.id,
            GroupMembership.status == MembershipStatus.ACTIVE,
        )
    )
    financial = (
        await db.execute(
            select(CoopFinancialRule).where(
                CoopFinancialRule.cooperative_id == coop.id,
                CoopFinancialRule.effective_to.is_(None),
            )
        )
    ).scalar_one_or_none()
    membership = (
        await db.execute(
            select(CoopMembershipRule).where(
                CoopMembershipRule.cooperative_id == coop.id,
                CoopMembershipRule.effective_to.is_(None),
            )
        )
    ).scalar_one_or_none()
    organizer = await db.get(User, coop.created_by) if coop.created_by else None
    policy = await get_policy(db, coop.id)

    frequency = financial.contribution_frequency if financial else None
    return CooperativePreview(
        id=coop.id,
        name=coop.name,
        description=coop.description,
        cover_image=coop.cover_image,
        status=coop.status,
        coop_model=coop.coop_model,
        created_at=coop.created_at,
        organizer=CooperativeOrganizer.model_validate(organizer) if organizer else None,
        member_count=member_count or 0,
        max_members=membership.max_members if membership else None,
        requires_approval=policy.mode != AdmissionMode.AUTOMATIC,
        admission=policy.mode.value,
        contribution_amount=float(financial.contribution_amount) if financial else None,
        contribution_currency=financial.currency if financial else None,
        contribution_frequency=getattr(frequency, "value", frequency),
    )
