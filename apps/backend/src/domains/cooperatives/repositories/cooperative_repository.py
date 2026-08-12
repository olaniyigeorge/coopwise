from __future__ import annotations

from typing import Sequence
from uuid import UUID

from sqlalchemy import select, or_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from src.domains.cooperatives.models.cooperative import CoopCooperative
from src.domains.memberships.models.group_membership import GroupMembership


class CooperativeRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def add(self, cooperative: CoopCooperative) -> CoopCooperative:
        self._session.add(cooperative)
        await self._session.flush()
        return cooperative

    async def get_by_id(self, cooperative_id: UUID | str) -> CoopCooperative | None:
        coop_id = str(cooperative_id)
        result = await self._session.execute(
            select(CoopCooperative).where(CoopCooperative.id == coop_id)
        )
        return result.scalar_one_or_none()

    async def list(self, *, limit: int = 50) -> Sequence[CoopCooperative]:
        result = await self._session.execute(
            select(CoopCooperative).order_by(CoopCooperative.created_at.desc()).limit(limit)
        )
        return result.scalars().all()

    async def get_for_user(self, user_id: UUID) -> list[CoopCooperative]:
        query = (
            select(CoopCooperative)
            .outerjoin(
                GroupMembership,
                GroupMembership.group_id == CoopCooperative.id,
            )
            .where(
                or_(
                    CoopCooperative.created_by == user_id,
                    GroupMembership.user_id == user_id,
                )
            )
            .distinct()
        )

        result = await self._session.execute(query)
        return list(result.scalars().all())

    async def get_members(self, cooperative_id: UUID) -> list[GroupMembership]:
        query = (
            select(GroupMembership)
            .options(selectinload(GroupMembership.user))
            .where(GroupMembership.group_id == cooperative_id)
        )

        result = await self._session.execute(query)
        return list(result.scalars().all())