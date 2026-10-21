from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from src.domains.cooperatives.exceptions import (
    CooperativeNotFoundError,
    IllegalStatusTransitionError,
    NotAuthorizedError,
)
from src.domains.cooperatives.preview import get_cooperative_preview
from src.api.middlewares.dependencies import get_current_user
from src.domains.auth.schemas import AuthenticatedUser
from src.domains.analytics.schemas import ActivityDetail
from src.domains.analytics.service import ActivityService
from src.infra.cache.redis_client import get_redis
from src.infra.db.dependencies import get_async_db_session
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
    CooperativePreview,
    CooperativeRead,
    CooperativeUpdate,
    DecisionRuleCreate,
    DecisionRuleRead,
    FinancialRuleCreate,
    FinancialRuleRead,
    GoalCategoryCreate,
    GoalCategoryRead,
    GoalContractCreate,
    GoalContractRead,
    GoalCreate,
    GoalRead,
    GoalUpdate,
    GovernanceRuleCreate,
    GovernanceRuleRead,
    GroupMemberRead,
    MembershipRuleCreate,
    MembershipRuleRead,
    OwnershipShareCreate,
    OwnershipShareRead,
    OwnershipShareUpdate,
)
from src.domains.cooperatives.services.beneficiary_pattern_service import (
    BeneficiaryPatternService,
)
from src.domains.cooperatives.services.cooperative_service import CooperativeService
from src.domains.cooperatives.services.goal_category_service import GoalCategoryService
from src.domains.cooperatives.services.goal_service import GoalService
from src.domains.cooperatives.services.ownership_share_service import (
    OwnershipShareService,
)
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
    return await service.create(**data.model_dump(), created_by=user.id)


@router.get("", response_model=list[CooperativeRead])
async def list_cooperatives(
    limit: int = 50,
    service: CooperativeService = Depends(get_cooperative_service),
):
    return await service.list(limit=limit)


@router.get("/me", response_model=list[CooperativeRead])
async def get_my_cooperatives(
    user: AuthenticatedUser = Depends(get_current_user),
    service: CooperativeService = Depends(get_cooperative_service),
):
    return await service.get_for_user(user.id)


@router.get(
    "/{cooperative_id}/members",
    response_model=list[GroupMemberRead],
)
async def get_cooperative_members(
    cooperative_id: UUID,
    user: AuthenticatedUser = Depends(get_current_user),
    service: CooperativeService = Depends(get_cooperative_service),
):
    cooperative = await service.get_by_id(cooperative_id)

    if cooperative is None:
        raise CooperativeNotFoundError(cooperative_id=cooperative_id)

    return await service.get_members(cooperative_id)


@router.get(
    "/{cooperative_id}/activities",
    response_model=list[ActivityDetail],
)
async def get_cooperative_activities(
    cooperative_id: UUID,
    limit: int = 20,
    user: AuthenticatedUser = Depends(get_current_user),
    service: CooperativeService = Depends(get_cooperative_service),
    db: AsyncSession = Depends(get_async_db_session),
    redis: Redis = Depends(get_redis),
):
    cooperative = await service.get_by_id(cooperative_id)

    if cooperative is None:
        raise CooperativeNotFoundError(cooperative_id=cooperative_id)

    return await ActivityService.get_group_activities(
        db, cooperative_id, user, redis, limit=limit
    )


@router.get("/{cooperative_id}/preview", response_model=CooperativePreview)
async def get_cooperative_preview_route(
    cooperative_id: UUID,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db_session),
):
    """Public-safe summary shown to someone deciding whether to join."""
    return await get_cooperative_preview(db, cooperative_id)


@router.get("/{cooperative_id}", response_model=CooperativeRead)
async def get_cooperative(
    cooperative_id: UUID,
    service: CooperativeService = Depends(get_cooperative_service),
):
    return await service.get_cooperative(cooperative_id)


# @router.get("/{cooperative_id}/full", response_model=CooperativeFullRead)
# async def get_cooperative_full(
#     cooperative_id: UUID,
#     service: CooperativeService = Depends(get_cooperative_service),
# ):
#     return await service.get_full(cooperative_id)


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
    try:
        return await service.activate(cooperative_id, user.id)
    except NotAuthorizedError:
        raise HTTPException(
            status_code=403,
            detail="Only the creator or an admin of this cooperative can activate it.",
        )
    except IllegalStatusTransitionError:
        raise HTTPException(
            status_code=400,
            detail="Only a pending cooperative can be activated.",
        )


# --- Rules ---


@router.post(
    "/{cooperative_id}/rules/governance",
    response_model=GovernanceRuleRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_governance_rule(
    cooperative_id: UUID,
    data: GovernanceRuleCreate,
    user: AuthenticatedUser = Depends(get_current_user),
    service: GovernanceRuleService = Depends(get_governance_rule_service),
):
    rule = CoopGovernanceRule(cooperative_id=cooperative_id, **data.model_dump())
    return await service.create(rule, acting_user_id=user.id)


@router.get(
    "/{cooperative_id}/rules/governance/active", response_model=GovernanceRuleRead
)
async def get_active_governance_rule(
    cooperative_id: UUID,
    service: GovernanceRuleService = Depends(get_governance_rule_service),
):
    return await service.get_active(cooperative_id)


@router.post(
    "/{cooperative_id}/rules/membership",
    response_model=MembershipRuleRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_membership_rule(
    cooperative_id: UUID,
    data: MembershipRuleCreate,
    user: AuthenticatedUser = Depends(get_current_user),
    service: MembershipRuleService = Depends(get_membership_rule_service),
):
    rule = CoopMembershipRule(cooperative_id=cooperative_id, **data.model_dump())
    return await service.create(rule, acting_user_id=user.id)


@router.get(
    "/{cooperative_id}/rules/membership/active", response_model=MembershipRuleRead
)
async def get_active_membership_rule(
    cooperative_id: UUID,
    service: MembershipRuleService = Depends(get_membership_rule_service),
):
    return await service.get_active(cooperative_id)


@router.post(
    "/{cooperative_id}/rules/financial",
    response_model=FinancialRuleRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_financial_rule(
    cooperative_id: UUID,
    data: FinancialRuleCreate,
    user: AuthenticatedUser = Depends(get_current_user),
    service: FinancialRuleService = Depends(get_financial_rule_service),
):
    rule = CoopFinancialRule(cooperative_id=cooperative_id, **data.model_dump())
    return await service.create(rule, acting_user_id=user.id)


@router.get(
    "/{cooperative_id}/rules/financial/active", response_model=FinancialRuleRead
)
async def get_active_financial_rule(
    cooperative_id: UUID,
    service: FinancialRuleService = Depends(get_financial_rule_service),
):
    return await service.get_active(cooperative_id)


@router.post(
    "/{cooperative_id}/rules/decision",
    response_model=DecisionRuleRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_decision_rule(
    cooperative_id: UUID,
    data: DecisionRuleCreate,
    user: AuthenticatedUser = Depends(get_current_user),
    service: DecisionRuleService = Depends(get_decision_rule_service),
):
    rule = CoopDecisionRule(cooperative_id=cooperative_id, **data.model_dump())
    return await service.create(rule, acting_user_id=user.id)


@router.get("/{cooperative_id}/rules/decision/active", response_model=DecisionRuleRead)
async def get_active_decision_rule(
    cooperative_id: UUID,
    decision_type: str,
    service: DecisionRuleService = Depends(get_decision_rule_service),
):
    return await service.get_active(cooperative_id, decision_type)


# --- Goals ---


@router.post(
    "/{cooperative_id}/goals",
    response_model=GoalRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_goal(
    cooperative_id: UUID,
    data: GoalCreate,
    user: AuthenticatedUser = Depends(get_current_user),
    service: GoalService = Depends(get_goal_service),
):
    goal = CoopGoal(
        cooperative_id=cooperative_id, created_by=user.id, **data.model_dump()
    )
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


@router.post(
    "/goals/{goal_id}/contract",
    response_model=GoalContractRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_goal_contract(
    goal_id: UUID,
    data: GoalContractCreate,
    user: AuthenticatedUser = Depends(get_current_user),
    service: GoalService = Depends(get_goal_service),
):
    return await service.create_goal_contract(goal_id, data, acting_user_id=user.id)


# --- Ownership shares (pooled_for_shared goals only) ---


@router.post(
    "/goals/{goal_id}/ownership-shares",
    response_model=OwnershipShareRead,
    status_code=status.HTTP_201_CREATED,
)
async def add_ownership_share(
    goal_id: UUID,
    data: OwnershipShareCreate,
    _user: AuthenticatedUser = Depends(get_current_user),
    service: OwnershipShareService = Depends(get_ownership_share_service),
):
    share = CoopOwnershipShare(goal_id=goal_id, **data.model_dump())
    return await service.add(share)


@router.get(
    "/goals/{goal_id}/ownership-shares", response_model=list[OwnershipShareRead]
)
async def list_ownership_shares(
    goal_id: UUID,
    service: OwnershipShareService = Depends(get_ownership_share_service),
):
    return await service.list_for_goal(goal_id)


@router.patch(
    "/goals/{goal_id}/ownership-shares/{share_id}",
    response_model=OwnershipShareRead,
)
async def update_ownership_share(
    goal_id: UUID,
    share_id: UUID,
    data: OwnershipShareUpdate,
    _user: AuthenticatedUser = Depends(get_current_user),
    service: OwnershipShareService = Depends(get_ownership_share_service),
):
    share = await service.update(goal_id, share_id, data)
    if share is None:
        raise HTTPException(status_code=404, detail="Ownership share not found")
    return share


@router.delete(
    "/goals/{goal_id}/ownership-shares/{share_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_ownership_share(
    goal_id: UUID,
    share_id: UUID,
    _user: AuthenticatedUser = Depends(get_current_user),
    service: OwnershipShareService = Depends(get_ownership_share_service),
):
    removed = await service.remove(goal_id, share_id)
    if not removed:
        raise HTTPException(status_code=404, detail="Ownership share not found")
    return None


# --- Catalog ---


@router.get(
    "/catalog/beneficiary-patterns", response_model=list[BeneficiaryPatternRead]
)
async def list_beneficiary_patterns(
    service: BeneficiaryPatternService = Depends(get_beneficiary_pattern_service),
):
    return await service.list()


@router.post(
    "/{cooperative_id}/goal-categories",
    response_model=GoalCategoryRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_goal_category(
    cooperative_id: UUID,
    data: GoalCategoryCreate,
    user: AuthenticatedUser = Depends(get_current_user),
    service: GoalCategoryService = Depends(get_goal_category_service),
):
    return await service.create(data, cooperative_id=cooperative_id)


@router.get("/catalog/goal-categories", response_model=list[GoalCategoryRead])
async def list_goal_categories(
    service: GoalCategoryService = Depends(get_goal_category_service),
):
    return await service.list()
