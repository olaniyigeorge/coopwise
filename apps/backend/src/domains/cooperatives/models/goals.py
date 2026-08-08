import uuid
from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, Numeric, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from src.domains.cooperatives.models.cooperative import CoopCooperative

from src.domains.cooperatives.models.enums import (
    ExitRuleType,
    GoalParticipantStatus,
    GoalStatus,
    OwnershipBasis,
    ValuationMethod,
)
from apps.backend.src.domains.memberships.models.mixins import Base, TimestampMixin, UUIDPrimaryKeyMixin


class CoopBeneficiaryPattern(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """
    The structural/mechanical axis. Small, deliberately-controlled system
    catalog — NOT self-serve. Adding a row here is expected to come with a
    code change (new `contract_schema` fields + exit/dispute logic), so
    we'll treat inserts as part of a migration/release, not admin tooling.

    Pilot patterns are seeded; rotating_tracked, pooled_for_one, pooled_for_shared,
    pooled_contingent — see `seed.py` in this package.
    """

    __tablename__ = "coop_beneficiary_patterns"

    code: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    requires_beneficiary: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    requires_ownership_shares: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    requires_claim_process: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    default_visibility: Mapped[str | None] = mapped_column(String(32), nullable=True)
    default_withdrawal_restriction: Mapped[str | None] = mapped_column(String(64), nullable=True)

    contract_schema: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    goals: Mapped[list["CoopGoal"]] = relationship(back_populates="beneficiary_pattern")

    def __repr__(self) -> str:
        return f"<CoopBeneficiaryPattern code={self.code}>"


class CoopGoalCategory(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """
    The descriptive/extensible axis. Fully open, self-serve taxonomy —
    drives discovery, AI templates, and defaults. NEVER overrides contract
    mechanics (that's `beneficiary_pattern`'s job).
    """

    __tablename__ = "coop_goal_categories"

    code: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    icon: Mapped[str | None] = mapped_column(String(255), nullable=True)

    parent_category_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("coop_goal_categories.id"), nullable=True
    )

    # This is just a hint/default only field. Can't be used to gate contract logic.
    suggested_beneficiary_pattern_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("coop_beneficiary_patterns.id"), nullable=True
    )

    is_system_defined: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # null = system-defined; set = a cooperative's own custom category.
    created_by_cooperative_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("coop_cooperatives.id"), nullable=True
    )

    parent: Mapped["CoopGoalCategory | None"] = relationship(remote_side="CoopGoalCategory.id")
    goals: Mapped[list["CoopGoal"]] = relationship(back_populates="goal_category")

    def __repr__(self) -> str:
        return f"<CoopGoalCategory code={self.code}>"


class CoopGoal(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """
    A goal always belongs to exactly one cooperative — created after the
    cooperative exists, never standalone. Two cooperatives can each have
    a goal named "Business A"; these remain distinct rows, not shared.
    """

    __tablename__ = "coop_goals"

    cooperative_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("coop_cooperatives.id"), nullable=False, index=True
    )
    beneficiary_pattern_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("coop_beneficiary_patterns.id"), nullable=False
    )
    goal_category_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("coop_goal_categories.id"), nullable=False
    )

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    target_amount: Mapped[float | None] = mapped_column(Numeric(14, 2), nullable=True)
    currency: Mapped[str] = mapped_column(String(8), nullable=False, default="NGN")
    target_date: Mapped[date | None] = mapped_column(nullable=True)

    status: Mapped[GoalStatus] = mapped_column(String(32), default=GoalStatus.PROPOSED, nullable=False)

    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )

    cooperative: Mapped["CoopCooperative"] = relationship(back_populates="goals")
    beneficiary_pattern: Mapped["CoopBeneficiaryPattern"] = relationship(back_populates="goals")
    goal_category: Mapped["CoopGoalCategory"] = relationship(back_populates="goals")

    contract: Mapped["CoopGoalContract"] = relationship(
        back_populates="goal", uselist=False, cascade="all, delete-orphan"
    )
    ownership_shares: Mapped[list["CoopOwnershipShare"]] = relationship(
        back_populates="goal", cascade="all, delete-orphan"
    )
    participants: Mapped[list["CoopGoalParticipant"]] = relationship(
        back_populates="goal", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<CoopGoal id={self.id} name={self.name!r} status={self.status}>"




class CoopGoalParticipant(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "coop_goal_participants"

    goal_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("coop_goals.id"), nullable=False, index=True
    )
    membership_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("group_memberships.id"), nullable=False, index=True
    )
    payout_position: Mapped[int] = mapped_column(nullable=False)
    round_number: Mapped[int] = mapped_column(nullable=False)
    status: Mapped[GoalParticipantStatus] = mapped_column(
        String(32), default=GoalParticipantStatus.WAITING, nullable=False
    )
    paid_at: Mapped[datetime | None] = mapped_column(nullable=True)

    __table_args__ = (
        UniqueConstraint("goal_id", "membership_id", name="uq_goal_participant_membership"),
    )

    goal: Mapped["CoopGoal"] = relationship(back_populates="participants")

    def __repr__(self) -> str:
        return f"<CoopGoalParticipant goal={self.goal_id} membership={self.membership_id} pos={self.payout_position}>"


class CoopGoalContract(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """
    Instantiated, per-goal rule package. Defaults are inherited from
    `beneficiary_pattern.contract_schema` at creation time; overridable
    only within the bounds that pattern allows — enforced at the
    service layer, not here.

    `beneficiary_user_id` required if pattern == pooled_for_one.
    `exit_rule_type` / `valuation_method` only apply to pooled_for_shared.
    `claim_eligibility_criteria` only applies to pooled_contingent.
    """

    __tablename__ = "coop_goal_contracts"

    goal_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("coop_goals.id"), unique=True, nullable=False
    )

    visibility: Mapped[str | None] = mapped_column(String(32), nullable=True)
    withdrawal_restriction: Mapped[str | None] = mapped_column(String(64), nullable=True)

    beneficiary_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    exit_rule_type: Mapped[ExitRuleType | None] = mapped_column(String(32), nullable=True)
    valuation_method: Mapped[ValuationMethod | None] = mapped_column(String(32), nullable=True)
    claim_eligibility_criteria: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    deadline: Mapped[date | None] = mapped_column(nullable=True)
    extra_terms: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    goal: Mapped["CoopGoal"] = relationship(back_populates="contract")

    def __repr__(self) -> str:
        return f"<CoopGoalContract goal={self.goal_id}>"


class CoopOwnershipShare(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Only populated for `pooled_for_shared` goals."""

    __tablename__ = "coop_ownership_shares"

    goal_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("coop_goals.id"), nullable=False, index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )

    share_pct: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    basis: Mapped[OwnershipBasis] = mapped_column(String(32), nullable=False)
    vested_at: Mapped[date | None] = mapped_column(nullable=True)

    goal: Mapped["CoopGoal"] = relationship(back_populates="ownership_shares")

    def __repr__(self) -> str:
        return f"<CoopOwnershipShare goal={self.goal_id} user={self.user_id} {self.share_pct}%>"