from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domains.cooperatives.models.goals import CoopGoalContract


class GoalContractRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def add(self, contract: CoopGoalContract) -> CoopGoalContract:
        self._session.add(contract)
        await self._session.flush()
        return contract

    async def get_by_goal_id(self, goal_id: UUID | str) -> CoopGoalContract | None:
        result = await self._session.execute(
            select(CoopGoalContract).where(CoopGoalContract.goal_id == str(goal_id))
        )
        return result.scalar_one_or_none()
