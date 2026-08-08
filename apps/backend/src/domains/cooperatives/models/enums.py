"""
Enums for the cooperatives domain.

Kept as plain Python `str` Enums mapped via SQLAlchemy's `Enum(..., native_enum=False)`
so they store as VARCHAR + CHECK constraint rather than a Postgres native enum type.
Native Postgres enums are a pain to alter (ADD VALUE can't run in a transaction with
other DDL pre-PG12, and dropping/renaming a value requires a full type rebuild), and
this schema is expected to evolve — e.g. new `beneficiary_patterns.code` values,
new `decision_rules.mechanism` values. If you'd rather have native enums, flip
`native_enum=True` per-column later; the Python side doesn't change.
"""

from enum import Enum


class CooperativeStatus(str, Enum):
    PENDING = "pending"
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    ARCHIVED = "archived"
    DELETED = "deleted"

class DecisionModel(str, Enum):
    ADMIN_LED = "admin_led"
    MAJORITY_VOTE = "majority_vote"
    CONSENSUS = "consensus"
    WEIGHTED_VOTE = "weighted_vote"


class RuleAmendmentApprovalType(str, Enum):
    ADMIN_ONLY = "admin_only"
    MAJORITY_VOTE = "majority_vote"
    UNANIMOUS = "unanimous"


class JoinType(str, Enum):
    INVITE_ONLY = "invite_only"
    OPEN = "open"
    APPLICATION_REQUIRED = "application_required"


class RemovalPolicy(str, Enum):
    VOTE = "vote"
    ADMIN = "admin"
    AUTO_ON_DEFAULT = "auto_on_default"


class ContributionFrequency(str, Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    BIWEEKLY = "biweekly"
    MONTHLY = "monthly"
    CUSTOM = "custom"


class PenaltyType(str, Enum):
    FLAT = "flat"
    PCT = "pct"
    NONE = "none"


class PayoutStrategy(str, Enum):
    ROTATING = "rotating"
    EQUAL = "equal"
    PRIORITY = "priority"


class RotationOrder(str, Enum):
    """Only meaningful when `payout_strategy == rotating`."""
 
    SEQUENTIAL = "sequential"
    RANDOM = "random"
    

class EscrowMode(str, Enum):
    SIMULATED_OFFCHAIN = "simulated_offchain"  # Phase 1
    ONCHAIN = "onchain"  # Phase 3


class DecisionType(str, Enum):
    PAYOUT_ORDER = "payout_order"
    DISPUTE_RESOLUTION = "dispute_resolution"
    EXIT_VALUATION = "exit_valuation"
    RULE_AMENDMENT = "rule_amendment"
    NEW_MEMBER_APPROVAL = "new_member_approval"


class DecisionMechanism(str, Enum):
    ADMIN = "admin"
    VOTE = "vote"
    AI_SUGGESTED = "ai_suggested"
    ROTATION = "rotation"
    LOTTERY = "lottery"


class BeneficiaryPatternCode(str, Enum):
    """
    This is intentionally an Enum (not free-text) even though 
    `beneficiary_patterns` is a DB-driven catalog table — new 
    patterns are "closer to a schema migration than a data insert" 
    per the doc, so a code change is expected to accompany a new row 
    anyway. Keeps `goal_contracts` branching logic (which fields
    are required per pattern) exhaustively checkable in code.
    """

    ROTATING_TRACKED = "rotating_tracked"
    POOLED_FOR_ONE = "pooled_for_one"
    POOLED_FOR_SHARED = "pooled_for_shared"
    POOLED_CONTINGENT = "pooled_contingent"


class GoalStatus(str, Enum):
    PROPOSED = "proposed"
    ACTIVE = "active"
    COMPLETED = "completed"
    ABANDONED = "abandoned"

class GoalParticipantStatus(str, Enum):
    WAITING = "waiting"
    PAID = "paid"
    SKIPPED = "skipped"

    
class ExitRuleType(str, Enum):
    """`pooled_for_shared` only."""

    BUYOUT = "buyout"
    DISSOLVE_AND_SPLIT = "dissolve_and_split"
    VOTE_TO_SELL = "vote_to_sell"


class ValuationMethod(str, Enum):
    """`pooled_for_shared` only."""

    CONTRIBUTION_BASED = "contribution_based"
    MARKET_APPRAISAL = "market_appraisal"
    NEGOTIATED = "negotiated"


class OwnershipBasis(str, Enum):
    CONTRIBUTION_BASED = "contribution_based"
    NEGOTIATED = "negotiated"


class CooperativeModel(str, Enum):
    """
    Cultural/product flavor of the cooperative itself — kept as a distinct
    axis from `beneficiary_pattern` (structural) and `goal_category`
    (per-goal, descriptive). This tags the whole cooperative so the
    frontend can drive a model-specific creation flow (e.g. an "esusu"
    flow can pre-select sane beneficiary_pattern/goal_category defaults
    and copy), while the actual contract mechanics still come from
    beneficiary_pattern, not from this field.
    """
 
    AJO = "ajo"
    ESUSU = "esusu"
    ADASHE = "adashe"
    CHAMA = "chama"
    COOP = "coop"