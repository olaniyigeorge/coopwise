from __future__ import annotations

from typing import Sequence
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domains.cooperatives.models.goals import CoopBeneficiaryPattern


class BeneficiaryPatternRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list(self) -> Sequence[CoopBeneficiaryPattern]:
        result = await self._session.execute(select(CoopBeneficiaryPattern).order_by(CoopBeneficiaryPattern.name))
        return result.scalars().all()

    async def get_by_id(self, pattern_id: UUID | str) -> CoopBeneficiaryPattern | None:
        pattern_id = str(pattern_id)
        result = await self._session.execute(
            select(CoopBeneficiaryPattern).where(CoopBeneficiaryPattern.id == pattern_id)
        )
        return result.scalar_one_or_none()

    async def get_by_code(self, code: str) -> CoopBeneficiaryPattern | None:
        result = await self._session.execute(
            select(CoopBeneficiaryPattern).where(CoopBeneficiaryPattern.code == code)
        )
        return result.scalar_one_or_none()
