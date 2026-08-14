from __future__ import annotations

from typing import Any
from uuid import UUID

from src.domains.cooperatives.schemas import GoalContractCreate
from src.domains.cooperatives.events import (
    EventDispatcher,
    GoalContractCreated,
    GoalCreated,
    NoOpEventDispatcher,
)
from src.domains.cooperatives.exceptions import (
    GoalContractAlreadyExistsError,
    GoalNotFoundError,
    InvalidContractFieldsError,
)
from src.domains.cooperatives.models.goals import CoopGoal, CoopGoalContract
from src.domains.cooperatives.uow import CooperativeUnitOfWork


class GoalService:
    def __init__(
        self,
        uow: CooperativeUnitOfWork,
        events: EventDispatcher | None = None,
        logger: Any | None = None,
    ) -> None:
        self._uow = uow
        self._events = events or NoOpEventDispatcher()
        self._logger = logger

    async def create(self, goal: CoopGoal, *, acting_user_id: UUID | str) -> CoopGoal:
        await self._uow.goals.add(goal)
        await self._uow.commit()
        await self._events.dispatch(
            GoalCreated(
                goal_id=goal.id,
                cooperative_id=goal.cooperative_id,
                actor_id=UUID(str(acting_user_id)),
            )
        )
        return goal

    async def get_by_id(self, goal_id: UUID | str) -> CoopGoal | None:
        return await self._uow.goals.get_by_id(goal_id)

    async def list_for_cooperative(self, cooperative_id: UUID | str):
        return await self._uow.goals.list_for_cooperative(cooperative_id)

    async def list_goals(
        self,
        cooperative_id: UUID | str,
        filters: dict[str, Any] | None = None,
        page: int = 1,
        page_size: int = 20,
    ):
        return await self._uow.goals.list_for_cooperative(cooperative_id)

    async def get_goal(self, goal_id: UUID | str) -> CoopGoal:
        goal = await self._uow.goals.get_by_id(goal_id)
        if goal is None:
            raise GoalNotFoundError(str(goal_id))
        return goal

    async def get_goal_detail(self, goal_id: UUID | str) -> dict[str, Any]:
        goal = await self.get_goal(goal_id)
        return {"goal": goal, "contract": None, "ownership_shares": []}

    async def update(
        self, goal_id: UUID | str, acting_user_id: UUID | str, **fields: Any
    ) -> CoopGoal:
        goal = await self.get_goal(goal_id)
        for key, value in fields.items():
            if key in {
                "name",
                "description",
                "target_amount",
                "currency",
                "target_date",
            }:
                setattr(goal, key, value)
        await self._uow.commit()
        return goal

    _PATTERN_ALLOWED_FIELDS: dict[str, set[str]] = {
        "rotating_tracked": {
            "visibility",
            "withdrawal_restriction",
            "deadline",
            "extra_terms",
        },
        "pooled_for_one": {
            "beneficiary_user_id",
            "deadline",
            "withdrawal_restriction",
            "visibility",
            "extra_terms",
        },
        "pooled_for_shared": {
            "exit_rule_type",
            "valuation_method",
            "visibility",
            "withdrawal_restriction",
            "extra_terms",
        },
        "pooled_contingent": {
            "claim_eligibility_criteria",
            "visibility",
            "withdrawal_restriction",
            "extra_terms",
        },
    }

    async def create_goal_contract(
        self,
        goal_id: UUID | str,
        data: GoalContractCreate,
        *,
        acting_user_id: UUID | str,
    ) -> CoopGoalContract:
        goal = await self.get_goal(goal_id)

        existing = await self._uow.goal_contracts.get_by_goal_id(goal_id)
        if existing is not None:
            raise GoalContractAlreadyExistsError(str(goal_id))

        pattern = await self._uow.beneficiary_patterns.get_by_id(
            goal.beneficiary_pattern_id
        )
        allowed = self._PATTERN_ALLOWED_FIELDS.get(pattern.code, set())

        submitted = data.model_dump(exclude_unset=True)
        invalid = [
            f for f in submitted if submitted[f] is not None and f not in allowed
        ]
        if invalid:
            raise InvalidContractFieldsError(pattern.code, invalid)

        contract = CoopGoalContract(goal_id=goal.id, **data.model_dump())
        await self._uow.goal_contracts.add(contract)
        await self._uow.commit()

        await self._events.dispatch(
            GoalContractCreated(
                goal_id=goal.id,
                cooperative_id=goal.cooperative_id,
                actor_id=UUID(str(acting_user_id)),
            )
        )
        return contract
