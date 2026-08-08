from __future__ import annotations

from typing import Any
from uuid import UUID

from src.domains.cooperatives.events import EventDispatcher, GoalContractCreated, GoalCreated, NoOpEventDispatcher
from src.domains.cooperatives.exceptions import GoalNotFoundError
from src.domains.cooperatives.models.goals import CoopGoal
from src.domains.cooperatives.uow import CooperativeUnitOfWork


class GoalService:
    def __init__(self, uow: CooperativeUnitOfWork, events: EventDispatcher | None = None, logger: Any | None = None) -> None:
        self._uow = uow
        self._events = events or NoOpEventDispatcher()
        self._logger = logger

    async def create(self, goal: CoopGoal, *, acting_user_id: UUID | str) -> CoopGoal:
        await self._uow.goals.add(goal)
        await self._uow.commit()
        await self._events.dispatch(
            GoalCreated(goal_id=goal.id, cooperative_id=goal.cooperative_id, actor_id=UUID(str(acting_user_id)))
        )
        return goal

    async def get_by_id(self, goal_id: UUID | str) -> CoopGoal | None:
        return await self._uow.goals.get_by_id(goal_id)

    async def list_for_cooperative(self, cooperative_id: UUID | str):
        return await self._uow.goals.list_for_cooperative(cooperative_id)

    async def list_goals(self, cooperative_id: UUID | str, filters: dict[str, Any] | None = None, page: int = 1, page_size: int = 20):
        return await self._uow.goals.list_for_cooperative(cooperative_id)

    async def get_goal(self, goal_id: UUID | str) -> CoopGoal:
        goal = await self._uow.goals.get_by_id(goal_id)
        if goal is None:
            raise GoalNotFoundError(str(goal_id))
        return goal

    async def get_goal_detail(self, goal_id: UUID | str) -> dict[str, Any]:
        goal = await self.get_goal(goal_id)
        return {"goal": goal, "contract": None, "ownership_shares": []}

    async def update(self, goal_id: UUID | str, acting_user_id: UUID | str, **fields: Any) -> CoopGoal:
        goal = await self.get_goal(goal_id)
        for key, value in fields.items():
            if key in {"name", "description", "target_amount", "currency", "target_date"}:
                setattr(goal, key, value)
        await self._uow.commit()
        return goal

    async def create_goal_contract(self, goal_id: UUID | str, *, acting_user_id: UUID | str) -> dict[str, Any]:
        # NOTE: stub — doesn't persist a CoopGoalContract row yet, just commits whatever's
        # already pending on the goal and emits the event. See router.py docstring for the
        # follow-up needed before this is wired to real contract data.
        goal = await self.get_goal(goal_id)
        await self._uow.commit()
        await self._events.dispatch(
            GoalContractCreated(
                goal_id=goal.id,
                cooperative_id=goal.cooperative_id,
                actor_id=UUID(str(acting_user_id)),
            )
        )
        return {"goal": goal, "contract": None}
