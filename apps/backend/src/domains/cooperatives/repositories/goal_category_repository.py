from __future__ import annotations

from typing import Sequence
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domains.cooperatives.models.goals import CoopGoalCategory


class GoalCategoryRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def add(self, category: CoopGoalCategory) -> CoopGoalCategory:
        self._session.add(category)
        await self._session.flush()
        return category

    async def list(self) -> Sequence[CoopGoalCategory]:
        result = await self._session.execute(select(CoopGoalCategory).order_by(CoopGoalCategory.name))
        return result.scalars().all()

    async def get_by_id(self, category_id: UUID | str) -> CoopGoalCategory | None:
        category_id = str(category_id)
        result = await self._session.execute(
            select(CoopGoalCategory).where(CoopGoalCategory.id == category_id)
        )
        return result.scalar_one_or_none()

    async def get_by_code(self, code: str) -> CoopGoalCategory | None:
        result = await self._session.execute(
            select(CoopGoalCategory).where(CoopGoalCategory.code == code)
        )
        return result.scalar_one_or_none()
