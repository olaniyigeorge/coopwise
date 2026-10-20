from __future__ import annotations

from decimal import Decimal
from typing import Any
from uuid import UUID

from src.domains.cooperatives.events import NoOpEventDispatcher
from src.domains.cooperatives.exceptions import OwnershipShareOverallocatedError
from src.domains.cooperatives.models.goals import CoopOwnershipShare
from src.domains.cooperatives.schemas import OwnershipShareUpdate
from src.domains.cooperatives.uow import CooperativeUnitOfWork


class OwnershipShareService:
    def __init__(
        self,
        uow: CooperativeUnitOfWork,
        events: Any | None = None,
        logger: Any | None = None,
    ) -> None:
        self._uow = uow
        self._events = events or NoOpEventDispatcher()
        self._logger = logger

    async def add(self, share: CoopOwnershipShare) -> CoopOwnershipShare:
        existing_total = await self._uow.ownership_shares.sum_share_pct_for_goal(
            share.goal_id
        )
        new_total = existing_total + Decimal(str(share.share_pct))
        if new_total > Decimal("100"):
            raise OwnershipShareOverallocatedError(float(new_total))

        await self._uow.ownership_shares.add(share)
        await self._uow.commit()
        return share

    async def list_for_goal(self, goal_id: UUID | str):
        return await self._uow.ownership_shares.list_for_goal(goal_id)

    async def update(
        self,
        goal_id: UUID | str,
        share_id: UUID | str,
        data: OwnershipShareUpdate,
    ) -> CoopOwnershipShare | None:
        share = await self._uow.ownership_shares.get_by_id(share_id)
        if share is None or str(share.goal_id) != str(goal_id):
            return None

        if data.share_pct is not None:
            existing_total = await self._uow.ownership_shares.sum_share_pct_for_goal(
                goal_id
            )
            # Replace this row's slice, then re-check the ceiling.
            new_total = (
                Decimal(str(existing_total))
                - Decimal(str(share.share_pct))
                + Decimal(str(data.share_pct))
            )
            if new_total > Decimal("100"):
                raise OwnershipShareOverallocatedError(float(new_total))
            share.share_pct = data.share_pct

        if data.basis is not None:
            share.basis = data.basis
        if "vested_at" in data.model_fields_set:
            share.vested_at = data.vested_at

        await self._uow.commit()
        return share

    async def remove(self, goal_id: UUID | str, share_id: UUID | str) -> bool:
        share = await self._uow.ownership_shares.get_by_id(share_id)
        if share is None or str(share.goal_id) != str(goal_id):
            return False
        await self._uow.ownership_shares.delete(share)
        await self._uow.commit()
        return True

    async def list_shares(self, goal_id: UUID | str):
        return await self.list_for_goal(goal_id)
