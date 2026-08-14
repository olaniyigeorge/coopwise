from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from src.domains.cooperatives.repositories.beneficiary_pattern_repository import (
    BeneficiaryPatternRepository,
)
from src.domains.cooperatives.repositories.goal_contract import GoalContractRepository
from src.domains.cooperatives.repositories.cooperative_repository import (
    CooperativeRepository,
)
from src.domains.cooperatives.repositories.goal_repository import GoalRepository
from src.domains.cooperatives.repositories.ownership_share_repository import (
    OwnershipShareRepository,
)
from src.domains.cooperatives.repositories.rules_repository import RulesRepository


class UnitOfWork:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.cooperatives = CooperativeRepository(session)
        self.rules = RulesRepository(session)
        self.goals = GoalRepository(session)
        self.goal_contracts = GoalContractRepository(session)
        self.ownership_shares = OwnershipShareRepository(session)
        self.beneficiary_patterns = BeneficiaryPatternRepository(session)

    async def __aenter__(self) -> "UnitOfWork":
        return self

    async def __aexit__(self, exc_type, exc, tb) -> None:
        if exc_type is not None:
            await self.session.rollback()

    async def commit(self) -> None:
        await self.session.commit()

    async def rollback(self) -> None:
        await self.session.rollback()


# alias — goal_service.py, ownership_share_service.py, and rule_services.py were written
# against this name; keep both so neither set of call sites needs changing
CooperativeUnitOfWork = UnitOfWork
