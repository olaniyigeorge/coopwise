from uuid import uuid4

import pytest

from src.domains.cooperatives.services.cooperative_service import CooperativeService
from src.domains.cooperatives.uow import UnitOfWork
from src.domains.memberships.models.enums import MembershipRole, MembershipStatus
from src.domains.memberships.models.group_membership import GroupMembership
from src.domains.users.models import User
from sqlalchemy import select


@pytest.mark.asyncio
async def test_creator_gets_active_membership_on_cooperative_creation(db_session):
    user = User(
        id=uuid4(),
        username=f"user_{uuid4().hex[:8]}",
        email=f"{uuid4().hex[:8]}@coopwise.example",
        full_name="Test Creator",
    )
    db_session.add(user)
    await db_session.flush()

    service = CooperativeService(UnitOfWork(db_session))
    cooperative = await service.create(name="Test Coop", created_by=user.id)

    result = await db_session.execute(
        select(GroupMembership).where(
            GroupMembership.user_id == user.id,
            GroupMembership.group_id == cooperative.id,
        )
    )
    membership = result.scalar_one()

    assert membership.role == MembershipRole.admin
    assert membership.status == MembershipStatus.ACTIVE
    assert membership.is_active is True
