/**
 * Types for the cooperative creation flow (Group -> Rules -> Goals).
 *
 * Source: docs/coopwise/frontend-design-cooperative-flow.md
 *
 * FLAGGED (per design doc §7.2): field lists for the four rule POST bodies
 * are reconstructed from the SQLAlchemy models via RulesRepository, not from
 * a confirmed Pydantic schema. Treat nullable/required and exact enum values
 * here as provisional until checked against the real request/response
 * schemas. Marked inline with `// UNCONFIRMED`.
 */

import { UUID } from "crypto";

// ---------------------------------------------------------------------------
// Cooperative
// ---------------------------------------------------------------------------

export type CoopModel = "ajo" | "esusu" | "adashe" | "chama" | "coop";

export type CooperativeStatus =
  | "pending"
  | "draft"
  | "active"
  | "paused"
  | "archived"
  | "deleted";

export interface Cooperative {
  id: string;
  name: string;
  description: string | null;
  cover_image_url: string | null;
  coop_model: CoopModel;
  status: CooperativeStatus;
  created_by: UUID;
  created_at: string;
  updated_at: string;
}

export interface CreateCooperativePayload {
  name: string;
  description?: string;
  coop_model: CoopModel;
  // cover_image is uploaded separately in most FastAPI setups (multipart) —
  // UNCONFIRMED whether this endpoint accepts a cover_image_url string at
  // creation time or expects a follow-up upload call. Assuming follow-up.
}

// Returned by POST /{id}/activate failure per CooperativeNotConfiguredError
export interface CooperativeNotConfiguredErrorBody {
  detail: {
    error: "CooperativeNotConfiguredError";
    missing: RequiredRuleType[]; // e.g. ["governance", "financial"]
    message?: string;
  };
}

// ---------------------------------------------------------------------------
// Rules
// ---------------------------------------------------------------------------

export type RequiredRuleType = "governance" | "membership" | "financial";
export type RuleType = RequiredRuleType | "decision";

/** Common fields every versioned rule row carries (VersionedMixin). */
export interface VersionedRule {
  id: string;
  cooperative_id: string;
  version: number;
  effective_from: string;
  effective_to: string | null; // null == currently active row
  created_at: string;
}

// --- Governance -------------------------------------------------------

export type DecisionModel = // UNCONFIRMED enum values
  | "admin_decides"
  | "majority_vote"
  | "supermajority_vote"
  | "consensus";

export type RuleAmendmentApprovalType = // UNCONFIRMED enum values
  | "admin_only"
  | "majority_vote"
  | "unanimous";

export interface GovernanceRule extends VersionedRule {
  decision_model: DecisionModel;
  quorum_pct: number; // 0-100
  voting_threshold_pct: number; // 0-100
  members_can_propose_changes: boolean;
  rule_amendment_approval_type: RuleAmendmentApprovalType;
}

export type CreateGovernanceRulePayload = Omit<
  GovernanceRule,
  keyof VersionedRule
>;

// --- Membership --------------------------------------------------------

export type JoinType = "open" | "invite_only" | "approval_required"; // UNCONFIRMED
export type KycLevelRequired = "none" | "basic" | "full"; 
export type RemovalPolicy = "admin" | "vote" | "auto_on_default"; 

export interface MembershipRule extends VersionedRule {
  join_type: JoinType;
  min_members: number;
  max_members: number | null;
  public_discovery: boolean;
  kyc_level_required: KycLevelRequired;
  exit_notice_days: number;
  removal_policy: RemovalPolicy;
}

export type CreateMembershipRulePayload = Omit<
  MembershipRule,
  keyof VersionedRule
>;

// --- Financial -----------------------------------------------------------

export type ContributionFrequency = // UNCONFIRMED enum values
  | "daily"
  | "weekly"
  | "biweekly"
  | "monthly";

export type PenaltyType = "none" | "flat" | "percentage"; // UNCONFIRMED
export type PayoutStrategy = "rotating" | "equal" | "priority";
export type RotationOrder = "sequential" | "random";

export interface FinancialRule extends VersionedRule {
  contribution_frequency: ContributionFrequency;
  contribution_amount: number;
  currency: string; // ISO 4217, e.g. "NGN"
  grace_period_days: number;
  penalty_type: PenaltyType;
  penalty_value: number | null; // hidden/omit when penalty_type === "none"
  payout_strategy: PayoutStrategy;
  rotation_order: RotationOrder;
}

export type CreateFinancialRulePayload = Omit<
  FinancialRule,
  keyof VersionedRule
>;

// --- Decision rules (optional, keyed by decision_type) -------------------

export type DecisionType =
  | "payout_order"
  | "dispute_resolution"
  | "exit_valuation"
  | "rule_amendment"
  | "new_member_approval";

export type DecisionMechanism =
  | "admin"
  | "vote"
  | "ai_suggested"
  | "rotation"
  | "lottery";

export interface DecisionRule extends VersionedRule {
  decision_type: DecisionType;
  mechanism: DecisionMechanism;
  escalation_path: Record<string, unknown> | null;
}

export type CreateDecisionRulePayload = Omit<
  DecisionRule,
  keyof VersionedRule
>;

/** Union used by the shared "active rule" fetch helper. */
export type AnyRule =
  | GovernanceRule
  | MembershipRule
  | FinancialRule
  | DecisionRule;

// ---------------------------------------------------------------------------
// Goals & beneficiary patterns
// ---------------------------------------------------------------------------

export type BeneficiaryPatternCode =
  | "rotating_tracked"
  | "pooled_for_one"
  | "pooled_for_shared"
  | "pooled_contingent";

export interface BeneficiaryPattern {
  id: string;
  code: BeneficiaryPatternCode;
  name: string;
  description: string | null;
  requires_beneficiary: boolean;
  requires_ownership_shares: boolean;
  requires_claim_process: boolean;
  contract_schema: {
    required_fields: string[];
  } | null;
}

export interface GoalCategory {
  id: string;
  code: string;
  name: string;
  description: string | null;
  icon: string | null;
  parent_category_id: string | null;
  suggested_beneficiary_pattern_id: string | null; // hint only, never a gate
  is_system_defined: boolean;
}

export type GoalStatus = "proposed" | "active" | "completed" | "abandoned";

export interface Goal {
  id: string;
  cooperative_id: string;
  name: string;
  description: string | null;
  target_amount: number;
  currency: string;
  target_date: string | null;
  goal_category_id: string;
  beneficiary_pattern_id: string;
  status: GoalStatus;
  created_at: string;
}

export interface CreateGoalPayload {
  name: string;
  description?: string;
  target_amount: number;
  currency: string;
  target_date?: string;
  goal_category_id: string;
  beneficiary_pattern_id: string;
}

// --- Goal contracts (dynamic per beneficiary_pattern) ---------------------

// `visibility` / `withdrawal_restriction` are free-text on the backend
// (GoalContractCreate.withdrawal_restriction: str | None) — these are just
// the values the UI offers, not an enforced enum.
export type WithdrawalRestriction = "locked_until_deadline" | "flexible";
export type ExitRuleType = "buyout" | "dissolve_and_split" | "vote_to_sell";
export type ValuationMethod = "contribution_based" | "market_appraisal" | "negotiated";
export type ContractBasis = "contribution_based" | "negotiated";

export interface RotatingTrackedContractFields {
  visibility: "group" | "private"; // UNCONFIRMED
  withdrawal_restriction: WithdrawalRestriction;
  deadline: string | null;
}

export interface PooledForOneContractFields {
  beneficiary_user_id: string;
  deadline: string;
  withdrawal_restriction: WithdrawalRestriction;
}

export interface PooledForSharedContractFields {
  exit_rule_type: ExitRuleType;
  valuation_method: ValuationMethod;
}

/**
 * FLAGGED (design doc §7.3): claim_eligibility_criteria is a raw JSONB with
 * no schema on the backend yet. Shape below is a placeholder so the Step 8
 * sub-builder UI has something concrete to bind to — do not treat as final.
 */
export interface PooledContingentContractFields {
  claim_eligibility_criteria: {
    trigger_type: string; // UNCONFIRMED
    conditions: Array<{ field: string; operator: string; value: string }>; // UNCONFIRMED
  };
}

export type GoalContractFields =
  | RotatingTrackedContractFields
  | PooledForOneContractFields
  | PooledForSharedContractFields
  | PooledContingentContractFields;

// Matches GoalContractRead — flat on the wire, not nested under `fields`.
export interface GoalContract {
  id: string;
  goal_id: string;
  visibility: string | null;
  withdrawal_restriction: string | null;
  beneficiary_user_id: string | null;
  exit_rule_type: ExitRuleType | null;
  valuation_method: ValuationMethod | null;
  claim_eligibility_criteria: Record<string, unknown> | null;
  deadline: string | null;
  extra_terms: Record<string, unknown> | null;
}

// Matches GoalContractCreate — a flat, all-optional bag of fields; the
// service layer enforces which ones are required/allowed per pattern.
export interface CreateGoalContractPayload {
  visibility?: string;
  withdrawal_restriction?: string;
  beneficiary_user_id?: string;
  exit_rule_type?: ExitRuleType;
  valuation_method?: ValuationMethod;
  claim_eligibility_criteria?: Record<string, unknown>;
  deadline?: string;
  extra_terms?: Record<string, unknown>;
}

export interface IncompleteGoalContractErrorBody {
  detail: {
    error: "IncompleteGoalContractError";
    missing: string[];
    message?: string;
  };
}

// --- Ownership shares (pooled_for_shared only) -----------------------------

export interface OwnershipShare {
  id: string;
  goal_id: string;
  user_id: string;
  share_pct: number; // 0-100
  basis: ContractBasis;
  vested_at: string | null;
}

export interface CreateOwnershipSharePayload {
  user_id: string;
  share_pct: number;
  basis: ContractBasis;
  vested_at?: string | null;
}

export interface OwnershipShareOverallocatedErrorBody {
  detail: {
    error: "OwnershipShareOverallocatedError";
    total_pct: number;
    message?: string;
  };
}

// ---------------------------------------------------------------------------
// Members (needed for Step 8 beneficiary picker + Step 9 share rows)
// ---------------------------------------------------------------------------

// Matches GroupMemberRead. Confirmed working: GET /{id}/members.
export interface CooperativeMember {
  id: string; // membership id
  user_id: string;
  group_id: string;
  role: string | null;
  status: string | null;
  user: {
    id: string;
    full_name: string;
    username: string;
    profile_picture_url: string | null;
  } | null;
}

// ---------------------------------------------------------------------------
// Activity feed
// ---------------------------------------------------------------------------

export interface ActivityDetail {
  id: string;
  user_id: string;
  group_id: string | null;
  type: string;
  description: string;
  entity_id?: string | null;
  amount?: number | null;
  created_at: string;
}