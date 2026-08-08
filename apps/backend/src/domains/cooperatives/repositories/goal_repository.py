from __future__ import annotations

from typing import Sequence
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domains.cooperatives.models.goals import CoopGoal


class GoalRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def add(self, goal: CoopGoal) -> CoopGoal:
        self._session.add(goal)
        await self._session.flush()
        return goal

    async def get_by_id(self, goal_id: UUID | str) -> CoopGoal | None:
        goal_id = str(goal_id)
        result = await self._session.execute(select(CoopGoal).where(CoopGoal.id == goal_id))
        return result.scalar_one_or_none()

    async def list_for_cooperative(self, cooperative_id: UUID | str) -> Sequence[CoopGoal]:
        cooperative_id = str(cooperative_id)
        result = await self._session.execute(
            select(CoopGoal)
            .where(CoopGoal.cooperative_id == cooperative_id)
            .order_by(CoopGoal.created_at.desc())
        )
        return result.scalars().all()
