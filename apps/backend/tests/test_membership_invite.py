from uuid import uuid4

import pytest
from fastapi import HTTPException

from config import AppConfig as config
from src.domains.cooperatives.models.enums import JoinType
from src.domains.cooperatives.models.rules import CoopMembershipRule
from src.domains.memberships.models.enums import MembershipStatus
from src.domains.memberships.service import CooperativeMembershipService
from tests.test_contribution_service import (
    _make_cooperative,
    _make_membership,
    _make_user,
)


def _code(inviter_id, group_id) -> str:
    return f"{config.INVITE_CODE_PREFIX}{inviter_id}:{group_id}"


async def _invitee_who_clicked(db_session, coop, inviter):
    invitee = await _make_user(db_session)
    code = _code(inviter.id, coop.id)
    await CooperativeMembershipService.checkout_invite_code(db_session, code, invitee)
    return invitee, code


async def _add_join_rule(db_session, coop, join_type):
    from src.domains.cooperatives.models.enums import RemovalPolicy

    db_session.add(
        CoopMembershipRule(
            cooperative_id=coop.id,
            join_type=join_type,
            removal_policy=RemovalPolicy.ADMIN,
        )
    )
    await db_session.flush()


@pytest.mark.asyncio
async def test_accepting_an_invite_activates_the_member(db_session):
    coop = await _make_cooperative(db_session)
    inviter = await _make_user(db_session)
    invitee, code = await _invitee_who_clicked(db_session, coop, inviter)

    membership = await CooperativeMembershipService.accept_invite_code(
        db_session, invitee, code
    )

    assert membership.status == MembershipStatus.ACTIVE
    assert membership.is_active
    assert membership.joined_at is not None


@pytest.mark.asyncio
async def test_application_required_groups_keep_invitee_pending(db_session):
    coop = await _make_cooperative(db_session)
    await _add_join_rule(db_session, coop, JoinType.APPLICATION_REQUIRED)
    inviter = await _make_user(db_session)
    invitee, code = await _invitee_who_clicked(db_session, coop, inviter)

    membership = await CooperativeMembershipService.accept_invite_code(
        db_session, invitee, code
    )

    assert membership.status == MembershipStatus.PENDING
    assert not membership.is_active


@pytest.mark.asyncio
async def test_reclicking_an_invite_does_not_downgrade_an_active_member(db_session):
    coop = await _make_cooperative(db_session)
    member = await _make_user(db_session)
    await _make_membership(db_session, member.id, coop.id)

    membership = await CooperativeMembershipService.accept_invite_code(
        db_session, member, _code(uuid4(), coop.id)
    )

    assert membership.status == MembershipStatus.ACTIVE


@pytest.mark.asyncio
async def test_removed_member_cannot_rejoin_by_invite(db_session):
    coop = await _make_cooperative(db_session)
    member = await _make_user(db_session)
    membership = await _make_membership(db_session, member.id, coop.id)
    membership.status = MembershipStatus.REMOVED
    await db_session.flush()

    with pytest.raises(HTTPException) as exc:
        await CooperativeMembershipService.accept_invite_code(
            db_session, member, _code(uuid4(), coop.id)
        )
    assert exc.value.status_code == 403
