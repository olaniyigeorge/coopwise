import uuid
from typing import TYPE_CHECKING


from sqlalchemy import Boolean, ForeignKey, Integer, Numeric, String, Index, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from apps.backend.src.domains.cooperatives.models.cooperative import CoopCooperative

from src.domains.cooperatives.models.enums import (
    ContributionFrequency,
    DecisionMechanism,
    DecisionModel,
    DecisionType,
    EscrowMode,
    JoinType,
    PenaltyType,
    RemovalPolicy,
    RuleAmendmentApprovalType,
)
from src.domains.cooperatives.models.mixins import (
    Base,
    TimestampMixin,
    UUIDPrimaryKeyMixin,
    VersionedMixin,
)


class CoopGovernanceRule(UUIDPrimaryKeyMixin, VersionedMixin, TimestampMixin, Base):
    """Structural decision-making rules for the cooperative itself."""

    __tablename__ = "coop_governance_rules"

    __table_args__ = (
        Index(
            "uq_coop_governance_rules_active",
            "cooperative_id",
            unique=True,
            postgresql_where=text("effective_to IS NULL")
        ),
    )

    cooperative_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("coop_cooperatives.id"), nullable=False, index=True
    )

    decision_model: Mapped[DecisionModel] = mapped_column(String(32), nullable=False)
    quorum_pct: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)
    voting_threshold_pct: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)
    members_can_propose_changes: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    rule_amendment_approval_type: Mapped[RuleAmendmentApprovalType | None] = mapped_column(
        String(32), nullable=True
    )

    extra_rules: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    cooperative: Mapped["CoopCooperative"] = relationship(back_populates="governance_rules")

    def __repr__(self) -> str:
        return f"<CoopGovernanceRule coop={self.cooperative_id} v{self.version}>"


class CoopMembershipRule(UUIDPrimaryKeyMixin, VersionedMixin, TimestampMixin, Base):
    __tablename__ = "coop_membership_rules"

    cooperative_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("coop_cooperatives.id"), nullable=False, index=True
    )

    join_type: Mapped[JoinType] = mapped_column(String(32), nullable=False)
    min_members: Mapped[int | None] = mapped_column(Integer, nullable=True)
    max_members: Mapped[int | None] = mapped_column(Integer, nullable=True)
    public_discovery: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    kyc_level_required: Mapped[str | None] = mapped_column(String(32), nullable=True)
    exit_notice_days: Mapped[int | None] = mapped_column(Integer, nullable=True)
    removal_policy: Mapped[RemovalPolicy] = mapped_column(String(32), nullable=False)

    extra_rules: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    cooperative: Mapped["CoopCooperative"] = relationship(back_populates="membership_rules")

    def __repr__(self) -> str:
        return f"<CoopMembershipRule coop={self.cooperative_id} v{self.version}>"


class CoopFinancialRule(UUIDPrimaryKeyMixin, VersionedMixin, TimestampMixin, Base):
    """
    Cooperative-level defaults; individual goals may override specific
    terms via `CoopGoalContract.extra_terms`.
    """

    __tablename__ = "coop_financial_rules"

    cooperative_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("coop_cooperatives.id"), nullable=False, index=True
    )

    contribution_frequency: Mapped[ContributionFrequency] = mapped_column(String(32), nullable=False)
    currency: Mapped[str] = mapped_column(String(8), nullable=False, default="NGN")
    grace_period_days: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    penalty_type: Mapped[PenaltyType] = mapped_column(String(16), default=PenaltyType.NONE, nullable=False)
    penalty_value: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    payment_rail_default: Mapped[str] = mapped_column(String(64), default="paystack", nullable=False)
    escrow_mode: Mapped[EscrowMode] = mapped_column(
        String(32), default=EscrowMode.SIMULATED_OFFCHAIN, nullable=False
    )

    extra_rules: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    cooperative: Mapped["CoopCooperative"] = relationship(back_populates="financial_rules")

    def __repr__(self) -> str:
        return f"<CoopFinancialRule coop={self.cooperative_id} v{self.version}>"


class CoopDecisionRule(UUIDPrimaryKeyMixin, VersionedMixin, TimestampMixin, Base):
    """
    Operational decision workflows — distinct from `CoopGovernanceRule`,
    which is structural. One current-effective row per
    (cooperative_id, decision_type).
    """

    __tablename__ = "coop_decision_rules"

    cooperative_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("coop_cooperatives.id"), nullable=False, index=True
    )

    decision_type: Mapped[DecisionType] = mapped_column(String(32), nullable=False, index=True)
    mechanism: Mapped[DecisionMechanism] = mapped_column(String(32), nullable=False)
    escalation_path: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    extra_rules: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    cooperative: Mapped["CoopCooperative"] = relationship(back_populates="decision_rules")

    def __repr__(self) -> str:
        return f"<CoopDecisionRule coop={self.cooperative_id} type={self.decision_type} v{self.version}>"