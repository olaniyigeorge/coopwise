from uuid import uuid4

import pytest
from fastapi import HTTPException

from config import AppConfig as config
from src.domains.cooperatives.models.enums import (
    DecisionMechanism,
    DecisionModel,
    DecisionType,
    JoinType,
    RemovalPolicy,
)
from src.domains.cooperatives.models.rules import (
    CoopDecisionRule,
    CoopGovernanceRule,
    CoopMembershipRule,
)
from src.domains.memberships import admission
from src.domains.memberships.admission import AdmissionMode, AdmissionPolicy, evaluate_votes
from src.domains.memberships.models.enums import MembershipRole, MembershipStatus
from src.domains.memberships.service import CooperativeMembershipService
from tests.test_contribution_service import (
    _make_cooperative,
    _make_membership,
    _make_user,
)


# ---- helpers -------------------------------------------------------------


async def _rules(db, coop, *, join=JoinType.INVITE_ONLY, max_members=None, governance=None, decision=None,
                 quorum=None, threshold=None):
    db.add(CoopMembershipRule(cooperative_id=coop.id, join_type=join, max_members=max_members,
                              removal_policy=RemovalPolicy.ADMIN))
    if governance:
        db.add(CoopGovernanceRule(cooperative_id=coop.id, decision_model=governance,
                                  quorum_pct=quorum, voting_threshold_pct=threshold))
    if decision:
        db.add(CoopDecisionRule(cooperative_id=coop.id, decision_type=DecisionType.NEW_MEMBER_APPROVAL,
                                mechanism=decision))
    await db.flush()


async def _member(db, coop, role=MembershipRole.member):
    user = await _make_user(db)
    membership = await _make_membership(db, user.id, coop.id)
    membership.role = role
    await db.flush()
    return user


async def _apply(db, coop):
    """A new person clicks an invite then accepts it."""
    applicant = await _make_user(db)
    code = f"{config.INVITE_CODE_PREFIX}{uuid4()}:{coop.id}"
    await CooperativeMembershipService.checkout_invite_code(db, code, applicant)
    membership = await CooperativeMembershipService.accept_invite_code(db, applicant, code)
    return applicant, membership


# ---- pure vote maths -----------------------------------------------------

MAJORITY = AdmissionPolicy(AdmissionMode.VOTE, quorum_pct=50, threshold_pct=50)
CONSENSUS = AdmissionPolicy(AdmissionMode.VOTE, quorum_pct=100, threshold_pct=100, unanimous=True)


def test_majority_needs_quorum_then_strict_majority():
    assert evaluate_votes(MAJORITY, eligible=10, approvals=4, rejections=0) == "pending"  # quorum 5
    assert evaluate_votes(MAJORITY, eligible=10, approvals=3, rejections=2) == "approved"
    assert evaluate_votes(MAJORITY, eligible=10, approvals=2, rejections=3) == "rejected"
    assert evaluate_votes(MAJORITY, eligible=10, approvals=3, rejections=3) == "rejected"  # tie is not a majority


def test_custom_threshold_is_at_least():
    two_thirds = AdmissionPolicy(AdmissionMode.VOTE, quorum_pct=50, threshold_pct=66.7)
    assert evaluate_votes(two_thirds, eligible=6, approvals=2, rejections=1) == "rejected"
    assert evaluate_votes(two_thirds, eligible=6, approvals=3, rejections=0) == "approved"


def test_consensus_one_objection_ends_it_and_needs_everyone():
    assert evaluate_votes(CONSENSUS, eligible=4, approvals=3, rejections=1) == "rejected"
    assert evaluate_votes(CONSENSUS, eligible=4, approvals=3, rejections=0) == "pending"
    assert evaluate_votes(CONSENSUS, eligible=4, approvals=4, rejections=0) == "approved"


# ---- automatic admission -------------------------------------------------


@pytest.mark.asyncio
@pytest.mark.parametrize("join", [JoinType.INVITE_ONLY, JoinType.OPEN])
async def test_invite_only_and_open_admit_immediately(db_session, join):
    coop = await _make_cooperative(db_session)
    await _rules(db_session, coop, join=join)
    _, membership = await _apply(db_session, coop)
    assert membership.status == MembershipStatus.ACTIVE and membership.joined_at is not None


@pytest.mark.asyncio
async def test_no_rules_configured_admits_on_invite(db_session):
    coop = await _make_cooperative(db_session)
    _, membership = await _apply(db_session, coop)
    assert membership.status == MembershipStatus.ACTIVE


@pytest.mark.asyncio
async def test_full_cooperative_rejects_new_members(db_session):
    coop = await _make_cooperative(db_session)
    await _rules(db_session, coop, max_members=1)
    await _member(db_session, coop)  # fills the only seat
    with pytest.raises(HTTPException) as exc:
        await _apply(db_session, coop)
    assert exc.value.status_code == 409


# ---- admin approval ------------------------------------------------------


@pytest.mark.asyncio
async def test_admin_led_queues_then_admin_approves(db_session):
    coop = await _make_cooperative(db_session)
    await _rules(db_session, coop, join=JoinType.APPLICATION_REQUIRED, governance=DecisionModel.ADMIN_LED)
    admin = await _member(db_session, coop, MembershipRole.admin)
    _, membership = await _apply(db_session, coop)
    assert membership.status == MembershipStatus.PENDING

    listed = await admission.list_applications(db_session, admin.id, coop.id)
    assert len(listed) == 1 and listed[0].mode == AdmissionMode.ADMIN and listed[0].can_decide

    result = await admission.decide(db_session, admin.id, membership.id, approve=True)
    assert result.status == "active"


@pytest.mark.asyncio
async def test_admin_can_reject(db_session):
    coop = await _make_cooperative(db_session)
    await _rules(db_session, coop, join=JoinType.APPLICATION_REQUIRED)
    admin = await _member(db_session, coop, MembershipRole.admin)
    _, membership = await _apply(db_session, coop)
    result = await admission.decide(db_session, admin.id, membership.id, approve=False)
    assert result.status == "rejected"


@pytest.mark.asyncio
async def test_regular_member_cannot_decide_when_admin_led(db_session):
    coop = await _make_cooperative(db_session)
    await _rules(db_session, coop, join=JoinType.APPLICATION_REQUIRED, governance=DecisionModel.ADMIN_LED)
    plain = await _member(db_session, coop)
    _, membership = await _apply(db_session, coop)
    with pytest.raises(HTTPException) as exc:
        await admission.decide(db_session, plain.id, membership.id, approve=True)
    assert exc.value.status_code == 403


@pytest.mark.asyncio
async def test_applicant_and_outsiders_cannot_decide_or_list(db_session):
    coop = await _make_cooperative(db_session)
    await _rules(db_session, coop, join=JoinType.APPLICATION_REQUIRED)
    await _member(db_session, coop, MembershipRole.admin)
    applicant, membership = await _apply(db_session, coop)
    with pytest.raises(HTTPException) as exc:
        await admission.decide(db_session, applicant.id, membership.id, approve=True)
    assert exc.value.status_code == 403
    outsider = await _make_user(db_session)
    with pytest.raises(HTTPException):
        await admission.list_applications(db_session, outsider.id, coop.id)


@pytest.mark.asyncio
async def test_decided_application_cannot_be_decided_again(db_session):
    coop = await _make_cooperative(db_session)
    await _rules(db_session, coop, join=JoinType.APPLICATION_REQUIRED)
    admin = await _member(db_session, coop, MembershipRole.admin)
    _, membership = await _apply(db_session, coop)
    await admission.decide(db_session, admin.id, membership.id, approve=True)
    with pytest.raises(HTTPException) as exc:
        await admission.decide(db_session, admin.id, membership.id, approve=False)
    assert exc.value.status_code == 409


@pytest.mark.asyncio
async def test_approving_into_a_full_cooperative_fails(db_session):
    coop = await _make_cooperative(db_session)
    await _rules(db_session, coop, join=JoinType.APPLICATION_REQUIRED, max_members=2)
    admin = await _member(db_session, coop, MembershipRole.admin)
    _, membership = await _apply(db_session, coop)
    await _member(db_session, coop)  # seat taken while the application waited
    with pytest.raises(HTTPException) as exc:
        await admission.decide(db_session, admin.id, membership.id, approve=True)
    assert exc.value.status_code == 409


# ---- member vote ---------------------------------------------------------


@pytest.mark.asyncio
async def test_majority_vote_admits_once_quorum_and_majority_reached(db_session):
    coop = await _make_cooperative(db_session)
    await _rules(db_session, coop, join=JoinType.APPLICATION_REQUIRED, governance=DecisionModel.MAJORITY_VOTE)
    voters = [await _member(db_session, coop) for _ in range(4)]
    _, membership = await _apply(db_session, coop)
    assert membership.status == MembershipStatus.PENDING

    r1 = await admission.decide(db_session, voters[0].id, membership.id, approve=True)
    assert r1.status == "pending" and r1.mode == AdmissionMode.VOTE and r1.eligible_voters == 4  # 1/4 < quorum
    r2 = await admission.decide(db_session, voters[1].id, membership.id, approve=True)
    assert r2.status == "active"  # 2/4 quorum, 100% approval


@pytest.mark.asyncio
async def test_majority_vote_rejects(db_session):
    coop = await _make_cooperative(db_session)
    await _rules(db_session, coop, join=JoinType.APPLICATION_REQUIRED, governance=DecisionModel.MAJORITY_VOTE)
    voters = [await _member(db_session, coop) for _ in range(3)]
    _, membership = await _apply(db_session, coop)
    await admission.decide(db_session, voters[0].id, membership.id, approve=False)
    result = await admission.decide(db_session, voters[1].id, membership.id, approve=False)
    assert result.status == "rejected"


@pytest.mark.asyncio
async def test_a_vote_can_be_changed_and_is_counted_once(db_session):
    coop = await _make_cooperative(db_session)
    await _rules(db_session, coop, join=JoinType.APPLICATION_REQUIRED, governance=DecisionModel.MAJORITY_VOTE,
                 quorum=100, threshold=50)
    voters = [await _member(db_session, coop) for _ in range(3)]
    _, membership = await _apply(db_session, coop)
    first = await admission.decide(db_session, voters[0].id, membership.id, approve=False)
    assert first.rejections == 1 and first.my_vote is False
    changed = await admission.decide(db_session, voters[0].id, membership.id, approve=True)
    assert changed.approvals == 1 and changed.rejections == 0 and changed.my_vote is True


@pytest.mark.asyncio
async def test_consensus_needs_every_member_and_one_no_blocks(db_session):
    coop = await _make_cooperative(db_session)
    await _rules(db_session, coop, join=JoinType.APPLICATION_REQUIRED, governance=DecisionModel.CONSENSUS)
    voters = [await _member(db_session, coop) for _ in range(3)]
    _, m1 = await _apply(db_session, coop)
    await admission.decide(db_session, voters[0].id, m1.id, approve=True)
    await admission.decide(db_session, voters[1].id, m1.id, approve=True)
    assert (await admission.decide(db_session, voters[2].id, m1.id, approve=True)).status == "active"

    _, m2 = await _apply(db_session, coop)
    blocked = await admission.decide(db_session, voters[0].id, m2.id, approve=False)
    assert blocked.status == "rejected"


@pytest.mark.asyncio
async def test_decision_rule_overrides_governance_model(db_session):
    coop = await _make_cooperative(db_session)
    await _rules(db_session, coop, join=JoinType.APPLICATION_REQUIRED, governance=DecisionModel.MAJORITY_VOTE,
                 decision=DecisionMechanism.ADMIN)
    plain = await _member(db_session, coop)
    admin = await _member(db_session, coop, MembershipRole.admin)
    _, membership = await _apply(db_session, coop)
    with pytest.raises(HTTPException):
        await admission.decide(db_session, plain.id, membership.id, approve=True)
    assert (await admission.decide(db_session, admin.id, membership.id, approve=True)).status == "active"


@pytest.mark.asyncio
async def test_vote_with_nobody_eligible_falls_back_to_an_admin(db_session):
    coop = await _make_cooperative(db_session)
    await _rules(db_session, coop, join=JoinType.APPLICATION_REQUIRED, governance=DecisionModel.MAJORITY_VOTE)
    # the creator is the only person who could decide: an admin on their own
    creator = await _make_user(db_session)
    coop.created_by = creator.id
    await db_session.flush()
    _, membership = await _apply(db_session, coop)
    listed = await admission.list_applications(db_session, creator.id, coop.id) if False else None
    result = await admission.decide(db_session, creator.id, membership.id, approve=True)
    assert result.status == "active"


@pytest.mark.asyncio
async def test_pending_member_stranded_in_an_automatic_group_can_be_settled_by_an_admin(db_session):
    """Legacy rows: 'pending' in a group whose rules admit automatically."""
    coop = await _make_cooperative(db_session)  # no rules => automatic
    admin = await _member(db_session, coop, MembershipRole.admin)
    stranded = await _make_user(db_session)
    membership = await _make_membership(db_session, stranded.id, coop.id)
    membership.status = MembershipStatus.PENDING
    await db_session.flush()

    listed = await admission.list_applications(db_session, admin.id, coop.id)
    assert len(listed) == 1 and listed[0].can_decide  # the buttons must exist

    result = await admission.decide(db_session, admin.id, membership.id, approve=True)
    assert result.status == "active"
