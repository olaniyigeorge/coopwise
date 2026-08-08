from __future__ import annotations

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

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


async def get_cooperative_service(
    uow: UnitOfWork = Depends(get_uow),
    memberships: MembershipsClient = Depends(get_memberships_client),
    events: EventDispatcher = Depends(get_event_dispatcher),
    logger: Logger = Depends(get_logger),
) -> CooperativeService:
    return CooperativeService(uow, memberships, events, logger)



def get_governance_rule_service(db: AsyncSession = Depends(get_async_db_session)) -> GovernanceRuleService:
    return GovernanceRuleService(db)


def get_membership_rule_service(db: AsyncSession = Depends(get_async_db_session)) -> MembershipRuleService:
    return MembershipRuleService(db)


def get_financial_rule_service(db: AsyncSession = Depends(get_async_db_session)) -> FinancialRuleService:
    return FinancialRuleService(db)


def get_decision_rule_service(db: AsyncSession = Depends(get_async_db_session)) -> DecisionRuleService:
    return DecisionRuleService(db)


def get_goal_service(db: AsyncSession = Depends(get_async_db_session)) -> GoalService:
    return GoalService(db)


def get_ownership_share_service(db: AsyncSession = Depends(get_async_db_session)) -> OwnershipShareService:
    return OwnershipShareService(db)


def get_beneficiary_pattern_service(db: AsyncSession = Depends(get_async_db_session)) -> BeneficiaryPatternService:
    return BeneficiaryPatternService(db)


def get_goal_category_service(db: AsyncSession = Depends(get_async_db_session)) -> GoalCategoryService:
    return GoalCategoryService(db)
