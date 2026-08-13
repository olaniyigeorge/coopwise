from datetime import date, datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from src.domains.cooperatives.models.enums import (
    ContributionFrequency,
    CooperativeModel,
    CooperativeStatus,
    DecisionMechanism,
    DecisionModel,
    DecisionType,
    EscrowMode,
    ExitRuleType,
    GoalStatus,
    JoinType,
    OwnershipBasis,
    PayoutStrategy,
    PenaltyType,
    RemovalPolicy,
    RotationOrder,
    RuleAmendmentApprovalType,
    ValuationMethod,
)


# --- Cooperative ---


class CooperativeCreate(BaseModel):
    name: str
    description: str | None = None
    cover_image: str | None = None
    coop_model: CooperativeModel = CooperativeModel.COOP


class CooperativeUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    cover_image: str | None = None


class CooperativeRead(BaseModel):
    id: UUID
    name: str
    description: str | None = None
    cover_image: str | None = None
    status: CooperativeStatus
    coop_model: CooperativeModel
    created_by: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Rules ---


class GovernanceRuleCreate(BaseModel):
    decision_model: DecisionModel
    quorum_pct: float | None = None
    voting_threshold_pct: float | None = None
    members_can_propose_changes: bool = True
    rule_amendment_approval_type: RuleAmendmentApprovalType | None = None
    extra_rules: dict[str, Any] | None = None


class MembershipRuleCreate(BaseModel):
    join_type: JoinType
    min_members: int | None = None
    max_members: int | None = None
    public_discovery: bool = False
    kyc_level_required: str | None = None
    exit_notice_days: int | None = None
    removal_policy: RemovalPolicy
    extra_rules: dict[str, Any] | None = None


class FinancialRuleCreate(BaseModel):
    contribution_frequency: ContributionFrequency
    contribution_amount: float
    currency: str = "NGN"
    grace_period_days: int = 0
    penalty_type: PenaltyType = PenaltyType.NONE
    penalty_value: float | None = None
    payment_rail_default: str = "paystack"
    escrow_mode: EscrowMode = EscrowMode.SIMULATED_OFFCHAIN
    payout_strategy: PayoutStrategy = PayoutStrategy.ROTATING
    rotation_order: RotationOrder | None = None
    extra_rules: dict[str, Any] | None = None


class DecisionRuleCreate(BaseModel):
    decision_type: DecisionType
    mechanism: DecisionMechanism
    escalation_path: dict[str, Any] | None = None
    extra_rules: dict[str, Any] | None = None


class RuleRead(BaseModel):
    id: UUID
    cooperative_id: UUID
    version: int
    effective_from: date
    effective_to: date | None = None

    model_config = ConfigDict(from_attributes=True)


class CooperativeFullRead(BaseModel):
    cooperative: CooperativeRead
    governance_rule: RuleRead | None
    membership_rule: RuleRead | None
    financial_rule: RuleRead | None
    decision_rule: RuleRead | None

    model_config = ConfigDict(from_attributes=True)


# --- Goals ---


class GoalCreate(BaseModel):
    beneficiary_pattern_id: UUID
    goal_category_id: UUID
    name: str
    description: str | None = None
    target_amount: float | None = None
    currency: str = "NGN"
    target_date: date | None = None


class GoalUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    target_amount: float | None = None
    currency: str | None = None
    target_date: date | None = None


class GoalRead(BaseModel):
    id: UUID
    cooperative_id: UUID
    beneficiary_pattern_id: UUID
    goal_category_id: UUID
    name: str
    description: str | None = None
    target_amount: float | None = None
    currency: str
    target_date: date | None = None
    status: GoalStatus
    created_by: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class GoalContractCreate(BaseModel):
    visibility: str | None = None
    withdrawal_restriction: str | None = None
    beneficiary_user_id: UUID | None = None
    exit_rule_type: ExitRuleType | None = None
    valuation_method: ValuationMethod | None = None
    claim_eligibility_criteria: dict[str, Any] | None = None
    deadline: date | None = None
    extra_terms: dict[str, Any] | None = None


class GoalContractRead(BaseModel):
    id: UUID
    goal_id: UUID
    visibility: str | None = None
    withdrawal_restriction: str | None = None
    beneficiary_user_id: UUID | None = None
    exit_rule_type: str | None = None
    valuation_method: str | None = None
    claim_eligibility_criteria: dict | None = None
    deadline: date | None = None
    extra_terms: dict | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class OwnershipShareCreate(BaseModel):
    user_id: UUID
    share_pct: float = Field(gt=0, le=100)
    basis: OwnershipBasis
    vested_at: date | None = None


class OwnershipShareRead(BaseModel):
    id: UUID
    goal_id: UUID
    user_id: UUID
    share_pct: float
    basis: OwnershipBasis
    vested_at: date | None = None

    model_config = ConfigDict(from_attributes=True)


# --- Catalog (beneficiary patterns / goal categories) ---


class BeneficiaryPatternRead(BaseModel):
    id: UUID
    code: str
    name: str
    description: str | None = None
    requires_beneficiary: bool
    requires_ownership_shares: bool
    requires_claim_process: bool
    contract_schema: dict[str, Any] | None = None

    model_config = ConfigDict(from_attributes=True)


class GoalCategoryCreate(BaseModel):
    code: str
    name: str
    description: str | None = None
    icon: str | None = None
    parent_category_id: UUID | None = None
    suggested_beneficiary_pattern_id: UUID | None = None


class GoalCategoryRead(BaseModel):
    id: UUID
    code: str
    name: str
    description: str | None = None
    icon: str | None = None
    parent_category_id: UUID | None = None
    suggested_beneficiary_pattern_id: UUID | None = None
    is_system_defined: bool
    created_by_cooperative_id: UUID | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class GroupMemberRead(BaseModel):
    id: UUID
    user_id: UUID
    cooperative_id: UUID
    role: str | None = None
    status: str | None = None

    model_config = ConfigDict(from_attributes=True)
