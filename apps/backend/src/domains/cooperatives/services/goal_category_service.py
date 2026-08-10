from __future__ import annotations

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from src.domains.cooperatives.exceptions import GoalCategoryConflictError
from src.domains.cooperatives.schemas import GoalCategoryCreate
from src.domains.cooperatives.models.goals import CoopGoalCategory
from src.domains.cooperatives.repositories.goal_category_repository import GoalCategoryRepository


class GoalCategoryService:
    def __init__(self, session: AsyncSession) -> None:
        self._repo = GoalCategoryRepository(session)

    async def create(
        self,
        data: GoalCategoryCreate,
        *,
        cooperative_id: UUID | str | None = None,
        is_system_defined: bool = False,
    ) -> CoopGoalCategory:
        existing = await self._repo.get_by_code(data.code)
        if existing is not None:
            raise GoalCategoryConflictError(data.code)

        category = CoopGoalCategory(
            **data.model_dump(),
            is_system_defined=is_system_defined,
            created_by_cooperative_id=cooperative_id,
        )
        return await self._repo.add(category)

    async def list(self):
        return await self._repo.list()

    async def get_by_id(self, category_id: UUID | str) -> CoopGoalCategory | None:
        return await self._repo.get_by_id(category_id)

    async def get_by_code(self, code: str) -> CoopGoalCategory | None:
        return await self._repo.get_by_code(code)        

    async def add(self, category: CoopGoalCategory) -> CoopGoalCategory:
        return await self._repo.add(category)

    async def list(self):
        return await self._repo.list()

    async def get_by_id(self, category_id: UUID | str) -> CoopGoalCategory | None:
        return await self._repo.get_by_id(category_id)

    async def get_by_code(self, code: str) -> CoopGoalCategory | None:
        return await self._repo.get_by_code(code)
