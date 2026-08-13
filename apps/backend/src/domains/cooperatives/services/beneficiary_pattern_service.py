from __future__ import annotations

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from src.domains.cooperatives.models.goals import CoopBeneficiaryPattern
from src.domains.cooperatives.repositories.beneficiary_pattern_repository import (
    BeneficiaryPatternRepository,
)


class BeneficiaryPatternService:
    def __init__(self, session: AsyncSession) -> None:
        self._repo = BeneficiaryPatternRepository(session)

    async def list(self):
        return await self._repo.list()

    async def get_by_id(self, pattern_id: UUID | str) -> CoopBeneficiaryPattern | None:
        return await self._repo.get_by_id(pattern_id)

    async def get_by_code(self, code: str) -> CoopBeneficiaryPattern | None:
        return await self._repo.get_by_code(code)
