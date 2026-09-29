"""
Who gets into a cooperative, and how — driven by the cooperative's own rules.

The rules already model this; this module is what enforces them:

  membership rule  join_type
      open / invite_only          -> AUTOMATIC   (an invite is itself the go-ahead)
      application_required        -> needs a decision, decided by:
  decision rule    NEW_MEMBER_APPROVAL mechanism (if the coop configured one)
  governance rule  decision_model  (fallback when there is no decision rule)
      admin_led                   -> ADMIN   one admin approves or rejects
      majority / weighted vote    -> VOTE    members vote; quorum + threshold
      consensus                   -> VOTE    unanimity among those who vote
  (no rules configured at all     -> ADMIN, the safe default)

`max_members` from the membership rule is enforced whenever someone would
become active.
"""

from dataclasses import dataclass
from datetime import datetime, timezone
from enum import Enum
from uuid import UUID

from fastapi import HTTPException, status
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domains.cooperatives.models.cooperative import CoopCooperative
from src.domains.cooperatives.models.enums import (
    DecisionMechanism,
    DecisionModel,
    DecisionType,
    JoinType,
)
from src.domains.cooperatives.models.rules import (
    CoopDecisionRule,
    CoopGovernanceRule,
    CoopMembershipRule,
)
from src.domains.memberships.models.enums import MembershipRole, MembershipStatus
from src.domains.memberships.models.group_membership import GroupMembership
from src.domains.memberships.models.vote import MembershipVote
from src.domains.users.models import User


class AdmissionMode(str, Enum):
    AUTOMATIC = "automatic"
    ADMIN = "admin_approval"
    VOTE = "member_vote"


@dataclass(frozen=True)
class AdmissionPolicy:
    mode: AdmissionMode
    quorum_pct: float = 50.0
    threshold_pct: float = 50.0
    unanimous: bool = False
    max_members: int | None = None


async def _active_rule(db: AsyncSession, model, coop_id: UUID, *extra):
    return (
        await db.execute(
            select(model).where(
                model.cooperative_id == coop_id, model.effective_to.is_(None), *extra
            )
        )
    ).scalar_one_or_none()


async def get_policy(db: AsyncSession, group_id: UUID) -> AdmissionPolicy:
    membership_rule = await _active_rule(db, CoopMembershipRule, group_id)
    max_members = membership_rule.max_members if membership_rule else None

    join_type = membership_rule.join_type if membership_rule else JoinType.INVITE_ONLY
    if join_type != JoinType.APPLICATION_REQUIRED:
        return AdmissionPolicy(AdmissionMode.AUTOMATIC, max_members=max_members)

    governance = await _active_rule(db, CoopGovernanceRule, group_id)
    decision_rule = await _active_rule(
        db,
        CoopDecisionRule,
        group_id,
        CoopDecisionRule.decision_type == DecisionType.NEW_MEMBER_APPROVAL,
    )

    unanimous = bool(governance and governance.decision_model == DecisionModel.CONSENSUS)

    if decision_rule is not None:
        mode = (
            AdmissionMode.VOTE
            if decision_rule.mechanism == DecisionMechanism.VOTE
            else AdmissionMode.ADMIN
        )
    elif governance is not None and governance.decision_model != DecisionModel.ADMIN_LED:
        mode = AdmissionMode.VOTE
    else:
        mode = AdmissionMode.ADMIN

    quorum = governance.quorum_pct if governance and governance.quorum_pct is not None else None
    threshold = (
        governance.voting_threshold_pct
        if governance and governance.voting_threshold_pct is not None
        else None
    )
    return AdmissionPolicy(
        mode=mode,
        quorum_pct=float(quorum) if quorum is not None else (100.0 if unanimous else 50.0),
        threshold_pct=float(threshold) if threshold is not None else (100.0 if unanimous else 50.0),
        unanimous=unanimous,
        max_members=max_members,
    )


def evaluate_votes(
    policy: AdmissionPolicy, eligible: int, approvals: int, rejections: int
) -> str:
    """'approved' | 'rejected' | 'pending' for a vote in progress."""
    cast = approvals + rejections
    if policy.unanimous and rejections > 0:
        return "rejected"  # one objection ends a consensus decision
    if eligible == 0 or cast == 0:
        return "pending"
    if cast * 100 < policy.quorum_pct * eligible:
        return "pending"  # quorum not reached yet
    if policy.unanimous:
        return "approved"  # quorum reached and nobody objected
    share = approvals * 100 / cast
    # A 50% threshold means a strict majority; any higher bar is "at least".
    passed = share > policy.threshold_pct if policy.threshold_pct <= 50 else share >= policy.threshold_pct
    return "approved" if passed else "rejected"


async def _active_count(db: AsyncSession, group_id: UUID) -> int:
    return (
        await db.scalar(
            select(func.count())
            .select_from(GroupMembership)
            .where(
                GroupMembership.group_id == group_id,
                GroupMembership.status == MembershipStatus.ACTIVE,
            )
        )
    ) or 0


async def _ensure_room(db: AsyncSession, policy: AdmissionPolicy, group_id: UUID) -> None:
    if policy.max_members is not None and await _active_count(db, group_id) >= policy.max_members:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This cooperative is full.",
        )


def _activate(membership: GroupMembership) -> None:
    membership.status = MembershipStatus.ACTIVE
    membership.joined_at = datetime.now(timezone.utc)


async def admit_or_queue(db: AsyncSession, membership: GroupMembership) -> GroupMembership:
    """Apply the cooperative's rules to someone who just accepted an invite."""
    policy = await get_policy(db, membership.group_id)
    if policy.mode == AdmissionMode.AUTOMATIC:
        await _ensure_room(db, policy, membership.group_id)
        _activate(membership)
    else:
        membership.status = MembershipStatus.PENDING
    await db.commit()
    await db.refresh(membership)
    return membership


# --------------------------------------------------------------------------
# Deciding on applications
# --------------------------------------------------------------------------


class Applicant(BaseModel):
    id: UUID
    username: str
    full_name: str
    profile_picture_url: str | None = None

    model_config = {"from_attributes": True}


class ApplicationRead(BaseModel):
    membership_id: UUID
    group_id: UUID
    applicant: Applicant
    status: str
    mode: AdmissionMode
    approvals: int = 0
    rejections: int = 0
    eligible_voters: int = 0
    quorum_pct: float = 50.0
    threshold_pct: float = 50.0
    can_decide: bool = False
    my_vote: bool | None = None
    applied_at: datetime | None = None


async def _actor_membership(db, actor_id: UUID, group_id: UUID) -> GroupMembership | None:
    return (
        await db.execute(
            select(GroupMembership).where(
                GroupMembership.user_id == actor_id,
                GroupMembership.group_id == group_id,
                GroupMembership.status == MembershipStatus.ACTIVE,
            )
        )
    ).scalars().first()


async def _is_admin(db, actor_id: UUID, group_id: UUID) -> bool:
    membership = await _actor_membership(db, actor_id, group_id)
    if membership is not None and membership.role == MembershipRole.admin:
        return True
    coop = await db.get(CoopCooperative, group_id)
    return bool(coop and coop.created_by == actor_id)


async def _tally(db, membership: GroupMembership):
    rows = (
        await db.execute(
            select(MembershipVote.approve, func.count())
            .where(MembershipVote.membership_id == membership.id)
            .group_by(MembershipVote.approve)
        )
    ).all()
    counts = {bool(approve): n for approve, n in rows}
    eligible = (
        await db.scalar(
            select(func.count())
            .select_from(GroupMembership)
            .where(
                GroupMembership.group_id == membership.group_id,
                GroupMembership.status == MembershipStatus.ACTIVE,
                GroupMembership.user_id != membership.user_id,
            )
        )
    ) or 0
    return counts.get(True, 0), counts.get(False, 0), eligible


async def _to_read(db, actor_id: UUID, membership: GroupMembership, policy: AdmissionPolicy) -> ApplicationRead:
    approvals, rejections, eligible = await _tally(db, membership)
    # A vote with nobody eligible to cast it falls back to an admin decision.
    mode = policy.mode
    if mode == AdmissionMode.VOTE and eligible == 0:
        mode = AdmissionMode.ADMIN
    if mode == AdmissionMode.AUTOMATIC:
        # Nobody should be pending in a group that admits automatically. If
        # someone is (left over from before admission rules were enforced, or
        # the rules were relaxed while they waited) an admin can settle it
        # rather than leaving them stuck forever.
        mode = AdmissionMode.ADMIN

    can_decide = False
    if membership.status == MembershipStatus.PENDING and membership.user_id != actor_id:
        if mode == AdmissionMode.ADMIN:
            can_decide = await _is_admin(db, actor_id, membership.group_id)
        elif mode == AdmissionMode.VOTE:
            can_decide = await _actor_membership(db, actor_id, membership.group_id) is not None

    my_vote = await db.scalar(
        select(MembershipVote.approve).where(
            MembershipVote.membership_id == membership.id,
            MembershipVote.voter_id == actor_id,
        )
    )
    applicant = await db.get(User, membership.user_id)
    return ApplicationRead(
        membership_id=membership.id,
        group_id=membership.group_id,
        applicant=Applicant.model_validate(applicant),
        status=str(getattr(membership.status, "value", membership.status)),
        mode=mode,
        approvals=approvals,
        rejections=rejections,
        eligible_voters=eligible,
        quorum_pct=policy.quorum_pct,
        threshold_pct=policy.threshold_pct,
        can_decide=can_decide,
        my_vote=my_vote,
        applied_at=membership.updated_at,
    )


async def list_applications(db: AsyncSession, actor_id: UUID, group_id: UUID) -> list[ApplicationRead]:
    if await _actor_membership(db, actor_id, group_id) is None and not await _is_admin(db, actor_id, group_id):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only members can see applications.")
    policy = await get_policy(db, group_id)
    pending = (
        await db.execute(
            select(GroupMembership)
            .where(
                GroupMembership.group_id == group_id,
                GroupMembership.status == MembershipStatus.PENDING,
            )
            .order_by(GroupMembership.updated_at)
        )
    ).scalars().all()
    return [await _to_read(db, actor_id, m, policy) for m in pending]


async def decide(
    db: AsyncSession, actor_id: UUID, membership_id: UUID, approve: bool
) -> ApplicationRead:
    membership = await db.get(GroupMembership, membership_id)
    if membership is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Application not found.")
    if membership.status != MembershipStatus.PENDING:
        raise HTTPException(status.HTTP_409_CONFLICT, "This application has already been decided.")
    if membership.user_id == actor_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "You can't decide on your own application.")

    policy = await get_policy(db, membership.group_id)
    view = await _to_read(db, actor_id, membership, policy)
    if not view.can_decide:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            "You aren't allowed to decide on this application.",
        )

    if view.mode == AdmissionMode.ADMIN:
        outcome = "approved" if approve else "rejected"
    else:
        vote = (
            await db.execute(
                select(MembershipVote).where(
                    MembershipVote.membership_id == membership.id,
                    MembershipVote.voter_id == actor_id,
                )
            )
        ).scalar_one_or_none()
        if vote is None:
            db.add(MembershipVote(membership_id=membership.id, voter_id=actor_id, approve=approve))
        else:
            vote.approve = approve
        await db.flush()
        approvals, rejections, eligible = await _tally(db, membership)
        outcome = evaluate_votes(policy, eligible, approvals, rejections)

    if outcome == "approved":
        await _ensure_room(db, policy, membership.group_id)
        _activate(membership)
    elif outcome == "rejected":
        membership.status = MembershipStatus.REJECTED

    await db.commit()
    await db.refresh(membership)
    return await _to_read(db, actor_id, membership, policy)
