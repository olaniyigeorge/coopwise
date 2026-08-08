from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy.ext.asyncio import AsyncSession

from src.domains.cooperatives.repositories.beneficiary_pattern_repository import BeneficiaryPatternRepository
from src.domains.cooperatives.repositories.cooperative_repository import CooperativeRepository
from src.domains.cooperatives.repositories.goal_category_repository import GoalCategoryRepository
from src.domains.cooperatives.repositories.goal_repository import GoalRepository
from src.domains.cooperatives.repositories.ownership_share_repository import OwnershipShareRepository
from src.domains.cooperatives.repositories.rules_repository import RulesRepository


class UnitOfWork:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.cooperatives = CooperativeRepository(session)
        self.rules = RulesRepository(session)          # generic, shared across the 4 rule types
        self.goals = GoalRepository(session)
        self.ownership_shares = OwnershipShareRepository(session)

    async def __aenter__(self) -> "UnitOfWork":
        return self

    async def __aexit__(self, exc_type, exc, tb) -> None:
        if exc_type is not None:
            await self.session.rollback()
        # no implicit commit on clean exit — commit is explicit, see below

    async def commit(self) -> None:
        await self.session.commit()

    async def rollback(self) -> None:
        await self.session.rollback()