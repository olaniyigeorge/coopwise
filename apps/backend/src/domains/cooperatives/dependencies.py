from __future__ import annotations

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.domains.cooperatives.events import EventDispatcher, NoOpEventDispatcher
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
from src.domains.cooperatives.uow import UnitOfWork
from src.infra.db.dependencies import get_async_db_session


async def get_uow(session: AsyncSession = Depends(get_async_db_session)) -> UnitOfWork:
    return UnitOfWork(session)


def get_event_dispatcher() -> EventDispatcher:
    # swap for a real Celery-backed dispatcher once notifications wiring exists;
    # NoOp keeps the domain layer functional without it
    return NoOpEventDispatcher()


async def get_cooperative_service(
    uow: UnitOfWork = Depends(get_uow),
    events: EventDispatcher = Depends(get_event_dispatcher),
) -> CooperativeService:
    return CooperativeService(uow, events)


def get_governance_rule_service(
    uow: UnitOfWork = Depends(get_uow),
    events: EventDispatcher = Depends(get_event_dispatcher),
) -> GovernanceRuleService:
    return GovernanceRuleService(uow, events)


def get_membership_rule_service(
    uow: UnitOfWork = Depends(get_uow),
    events: EventDispatcher = Depends(get_event_dispatcher),
) -> MembershipRuleService:
    return MembershipRuleService(uow, events)


def get_financial_rule_service(
    uow: UnitOfWork = Depends(get_uow),
    events: EventDispatcher = Depends(get_event_dispatcher),
) -> FinancialRuleService:
    return FinancialRuleService(uow, events)


def get_decision_rule_service(
    uow: UnitOfWork = Depends(get_uow),
    events: EventDispatcher = Depends(get_event_dispatcher),
) -> DecisionRuleService:
    return DecisionRuleService(uow, events)


def get_goal_service(
    uow: UnitOfWork = Depends(get_uow),
    events: EventDispatcher = Depends(get_event_dispatcher),
) -> GoalService:
    return GoalService(uow, events)


def get_ownership_share_service(
    uow: UnitOfWork = Depends(get_uow),
    events: EventDispatcher = Depends(get_event_dispatcher),
) -> OwnershipShareService:
    return OwnershipShareService(uow, events)


def get_beneficiary_pattern_service(db: AsyncSession = Depends(get_async_db_session)) -> BeneficiaryPatternService:
    return BeneficiaryPatternService(db)


def get_goal_category_service(db: AsyncSession = Depends(get_async_db_session)) -> GoalCategoryService:
    return GoalCategoryService(db)
