from uuid import UUID

from fastapi import APIRouter, Depends, status

from src.api.middlewares.dependencies import get_current_user
from src.domains.auth.schemas import AuthenticatedUser
from src.domains.cooperatives.dependencies import (
    get_beneficiary_pattern_service,
    get_cooperative_service,
    get_decision_rule_service,
    get_financial_rule_service,
    get_goal_category_service,
    get_goal_service,
    get_governance_rule_service,
    get_membership_rule_service,
    get_ownership_share_service,
)
from src.domains.cooperatives.models.goals import CoopGoal, CoopOwnershipShare
from src.domains.cooperatives.models.rules import (
    CoopDecisionRule,
    CoopFinancialRule,
    CoopGovernanceRule,
    CoopMembershipRule,
)
from src.domains.cooperatives.schemas import (
    BeneficiaryPatternRead,
    CooperativeCreate,
    CooperativeRead,
    CooperativeUpdate,
    DecisionRuleCreate,
    FinancialRuleCreate,
    GoalCategoryRead,
    GoalContractCreate,
    GoalCreate,
    GoalRead,
    GoalUpdate,
    GovernanceRuleCreate,
    MembershipRuleCreate,
    OwnershipShareCreate,
    OwnershipShareRead,
    RuleRead,
)
from src.domains.cooperatives.services.beneficiary_pattern_service import BeneficiaryPatternService
from src.domains.cooperatives.services.cooperative_service import CooperativeService
from src.domains.cooperatives.services.goal_category_service import GoalCategoryService
from src.domains.cooperatives.services.goal_service import GoalService
from src.domains.cooperatives.services.ownership_share_service import OwnershipShareService
from src.domains.cooperatives.services.rule_services import (
    DecisionRuleService,
    FinancialRuleService,
    GovernanceRuleService,
    MembershipRuleService,
)

router = APIRouter(prefix="/api/v1/cooperatives", tags=["Cooperatives"])


# --- Cooperative ---

@router.post("", response_model=CooperativeRead, status_code=status.HTTP_201_CREATED)
async def create_cooperative(
    data: CooperativeCreate,
    user: AuthenticatedUser = Depends(get_current_user),
    service: CooperativeService = Depends(get_cooperative_service),
):
    return await service.create(name=data.name, description=data.description, created_by=user.id)


@router.get("", response_model=list[CooperativeRead])
async def list_cooperatives(
    limit: int = 50,
    service: CooperativeService = Depends(get_cooperative_service),
):
    return await service.list(limit=limit)


@router.get("/{cooperative_id}", response_model=CooperativeRead)
async def get_cooperative(
    cooperative_id: UUID,
    service: CooperativeService = Depends(get_cooperative_service),
):
    return await service.get_cooperative(cooperative_id)


@router.patch("/{cooperative_id}", response_model=CooperativeRead)
async def update_cooperative(
    cooperative_id: UUID,
    data: CooperativeUpdate,
    user: AuthenticatedUser = Depends(get_current_user),
    service: CooperativeService = Depends(get_cooperative_service),
):
    fields = data.model_dump(exclude_unset=True)
    return await service.update(cooperative_id, user.id, **fields)


@router.post("/{cooperative_id}/activate", response_model=CooperativeRead)
async def activate_cooperative(
    cooperative_id: UUID,
    user: AuthenticatedUser = Depends(get_current_user),
    service: CooperativeService = Depends(get_cooperative_service),
):
    return await service.activate(cooperative_id, user.id)


# --- Rules ---

@router.post("/{cooperative_id}/rules/governance", response_model=RuleRead, status_code=status.HTTP_201_CREATED)
async def create_governance_rule(
    cooperative_id: UUID,
    data: GovernanceRuleCreate,
    user: AuthenticatedUser = Depends(get_current_user),
    service: GovernanceRuleService = Depends(get_governance_rule_service),
):
    rule = CoopGovernanceRule(cooperative_id=cooperative_id, **data.model_dump())
    return await service.create(rule, acting_user_id=user.id)


@router.get("/{cooperative_id}/rules/governance/active", response_model=RuleRead)
async def get_active_governance_rule(
    cooperative_id: UUID,
    service: GovernanceRuleService = Depends(get_governance_rule_service),
):
    return await service.get_active(cooperative_id)


@router.post("/{cooperative_id}/rules/membership", response_model=RuleRead, status_code=status.HTTP_201_CREATED)
async def create_membership_rule(
    cooperative_id: UUID,
    data: MembershipRuleCreate,
    user: AuthenticatedUser = Depends(get_current_user),
    service: MembershipRuleService = Depends(get_membership_rule_service),
):
    rule = CoopMembershipRule(cooperative_id=cooperative_id, **data.model_dump())
    return await service.create(rule, acting_user_id=user.id)


@router.get("/{cooperative_id}/rules/membership/active", response_model=RuleRead)
async def get_active_membership_rule(
    cooperative_id: UUID,
    service: MembershipRuleService = Depends(get_membership_rule_service),
):
    return await service.get_active(cooperative_id)


@router.post("/{cooperative_id}/rules/financial", response_model=RuleRead, status_code=status.HTTP_201_CREATED)
async def create_financial_rule(
    cooperative_id: UUID,
    data: FinancialRuleCreate,
    user: AuthenticatedUser = Depends(get_current_user),
    service: FinancialRuleService = Depends(get_financial_rule_service),
):
    rule = CoopFinancialRule(cooperative_id=cooperative_id, **data.model_dump())
    return await service.create(rule, acting_user_id=user.id)


@router.get("/{cooperative_id}/rules/financial/active", response_model=RuleRead)
async def get_active_financial_rule(
    cooperative_id: UUID,
    service: FinancialRuleService = Depends(get_financial_rule_service),
):
    return await service.get_active(cooperative_id)


@router.post("/{cooperative_id}/rules/decision", response_model=RuleRead, status_code=status.HTTP_201_CREATED)
async def create_decision_rule(
    cooperative_id: UUID,
    data: DecisionRuleCreate,
    user: AuthenticatedUser = Depends(get_current_user),
    service: DecisionRuleService = Depends(get_decision_rule_service),
):
    rule = CoopDecisionRule(cooperative_id=cooperative_id, **data.model_dump())
    return await service.create(rule, acting_user_id=user.id)


@router.get("/{cooperative_id}/rules/decision/active", response_model=RuleRead)
async def get_active_decision_rule(
    cooperative_id: UUID,
    service: DecisionRuleService = Depends(get_decision_rule_service),
):
    return await service.get_active(cooperative_id)


# --- Goals ---

@router.post("/{cooperative_id}/goals", response_model=GoalRead, status_code=status.HTTP_201_CREATED)
async def create_goal(
    cooperative_id: UUID,
    data: GoalCreate,
    user: AuthenticatedUser = Depends(get_current_user),
    service: GoalService = Depends(get_goal_service),
):
    goal = CoopGoal(cooperative_id=cooperative_id, created_by=user.id, **data.model_dump())
    return await service.create(goal, acting_user_id=user.id)


@router.get("/{cooperative_id}/goals", response_model=list[GoalRead])
async def list_goals(
    cooperative_id: UUID,
    service: GoalService = Depends(get_goal_service),
):
    return await service.list_for_cooperative(cooperative_id)


@router.get("/goals/{goal_id}", response_model=GoalRead)
async def get_goal(
    goal_id: UUID,
    service: GoalService = Depends(get_goal_service),
):
    return await service.get_goal(goal_id)


@router.patch("/goals/{goal_id}", response_model=GoalRead)
async def update_goal(
    goal_id: UUID,
    data: GoalUpdate,
    user: AuthenticatedUser = Depends(get_current_user),
    service: GoalService = Depends(get_goal_service),
):
    fields = data.model_dump(exclude_unset=True)
    return await service.update(goal_id, user.id, **fields)


@router.post("/goals/{goal_id}/contract", status_code=status.HTTP_201_CREATED)
async def create_goal_contract(
    goal_id: UUID,
    data: GoalContractCreate,
    user: AuthenticatedUser = Depends(get_current_user),
    service: GoalService = Depends(get_goal_service),
):
    # NOTE: `data` isn't persisted yet — GoalService.create_goal_contract() is a stub
    # (returns contract=None). Wire actual CoopGoalContract creation into that method
    # before this endpoint does anything beyond emitting the event. Flagging rather than
    # silently accepting the payload and dropping it.
    return await service.create_goal_contract(goal_id, acting_user_id=user.id)


# --- Ownership shares (pooled_for_shared goals only) ---

@router.post("/goals/{goal_id}/ownership-shares", response_model=OwnershipShareRead, status_code=status.HTTP_201_CREATED)
async def add_ownership_share(
    goal_id: UUID,
    data: OwnershipShareCreate,
    user: AuthenticatedUser = Depends(get_current_user),
    service: OwnershipShareService = Depends(get_ownership_share_service),
):
    share = CoopOwnershipShare(goal_id=goal_id, **data.model_dump())
    return await service.add(share)


@router.get("/goals/{goal_id}/ownership-shares", response_model=list[OwnershipShareRead])
async def list_ownership_shares(
    goal_id: UUID,
    service: OwnershipShareService = Depends(get_ownership_share_service),
):
    return await service.list_for_goal(goal_id)


# --- Catalog ---

@router.get("/catalog/beneficiary-patterns", response_model=list[BeneficiaryPatternRead])
async def list_beneficiary_patterns(
    service: BeneficiaryPatternService = Depends(get_beneficiary_pattern_service),
):
    return await service.list()


@router.get("/catalog/goal-categories", response_model=list[GoalCategoryRead])
async def list_goal_categories(
    service: GoalCategoryService = Depends(get_goal_category_service),
):
    return await service.list()
