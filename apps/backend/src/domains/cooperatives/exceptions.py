from __future__ import annotations
from uuid import UUID


class CooperativeDomainError(Exception):
    """Base class for every exception raised out of this domain's service layer.
 
    Lets the API layer add a single blanket `except CooperativeDomainError` fallback (mapped to
    a generic 400/500) without having to enumerate every subclass, while still being able to
    special-case the ones below to their specific status codes.
    """



class CooperativeNotFoundError(CooperativeDomainError):
    """Raised by get_cooperative() / any lookup when the id doesn't exist. -> 404"""
 
    def __init__(self, cooperative_id: UUID) -> None:
        self.cooperative_id = cooperative_id
        super().__init__(f"Cooperative {cooperative_id} not found")
 

class GoalNotFoundError(CooperativeDomainError):
    """Raised by get_goal() / any lookup when the id doesn't exist. -> 404"""
 
    def __init__(self, goal_id: UUID) -> None:
        self.goal_id = goal_id
        super().__init__(f"Goal {goal_id} not found")
 
 
class CooperativeNotConfiguredError(CooperativeDomainError):
    """Raised by activate() when governance/membership/financial rules aren't all set. -> 409
 
    `missing` lists exactly which of ["governance_rules", "membership_rules",
    "financial_rules"] are absent — this is what the frontend "Setup incomplete: X, Y" banner
    reads, so keep it precise rather than collapsing to a generic message.
    """
 
    def __init__(self, missing: list[str]) -> None:
        self.missing = missing
        super().__init__(f"Cooperative not configured, missing: {', '.join(missing)}")
 
 
class IllegalStatusTransitionError(CooperativeDomainError):
    """Raised whenever a status-machine guard fails (wrong current state for the transition
    attempted, e.g. activate() called on a COMPLETED cooperative, or a membership/quorum guard
    inside activate() fails). -> 409
    """
 
    def __init__(self, from_status: str, to_status: str) -> None:
        self.from_status = from_status
        self.to_status = to_status
        super().__init__(f"Cannot transition from {from_status} to {to_status}")
 
 
class NotAuthorizedError(CooperativeDomainError):
    """Raised when acting_user_id lacks the admin/owner role required for the action. -> 403
 
    Deliberately carries no cooperative_id / role detail in the message — that's for the log
    line (which has full context via `extra={}`), not for what gets surfaced to the caller.
    """
 
 
class IncompleteGoalContractError(CooperativeDomainError):
    """Raised by create_goal_contract() when a beneficiary_pattern-required field is missing.
    -> 422
 
    `missing` lists exactly which required_fields from the pattern's contract_schema weren't
    supplied — same "precise list, not a generic 400" pattern as CooperativeNotConfiguredError.
    """
 
    def __init__(self, missing: list[str]) -> None:
        self.missing = missing
        super().__init__(f"Goal contract incomplete, missing: {', '.join(missing)}")
 
 
class InvalidGoalContractError(CooperativeDomainError):
    """Raised by create_goal_contract() for pattern-specific cross-field invariant violations
    (e.g. pooled_for_shared missing exit_rule_type when valuation_method is set; pooled_for_one
    beneficiary_user_id not an actual cooperative member). -> 422
    """
 
    def __init__(self, reason: str) -> None:
        self.reason = reason
        super().__init__(reason)
 
 
class OwnershipShareOverallocatedError(CooperativeDomainError):
    """Raised when a new/updated share_pct would push a goal's total shares over 100%, or when
    GoalService.activate() finds a pooled_for_shared goal whose shares don't sum to exactly
    100%. -> 422
    """
 
    def __init__(self, current_total_pct: float) -> None:
        self.current_total_pct = current_total_pct
        super().__init__(f"Ownership shares would total {current_total_pct}%, exceeding 100%")










