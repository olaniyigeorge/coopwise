"""
Domain events for `domains/cooperatives`.

These are plain dataclasses only — no dispatch mechanism lives here. The Celery-enqueue /
event-to-task plumbing is shared infra (other domains will emit events too), imported from
there. A service emits one of these via `self.events.dispatch(...)` only AFTER its
UnitOfWork.commit() has succeeded — never before, and never if the commit failed.

Every event carries the ids needed to look the thing back up (never the full ORM object — by
the time notifications processes it async, that instance may be stale/detached) plus
`actor_id` where there's a clear acting user, so notifications can render "X changed by Y" and
can exclude the actor from the notified-members list if desired.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Protocol
from uuid import UUID


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class EventDispatcher(Protocol):
    async def dispatch(self, event: object) -> None: ...


class NoOpEventDispatcher:
    async def dispatch(self, event: object) -> None:
        return None


@dataclass(frozen=True)
class DomainEvent:
    """Base class. `occurred_at` is stamped at construction time (event-creation time), not
    commit time — the two are close enough in practice and this keeps the dataclass simple.
    """

    occurred_at: datetime = field(default_factory=_utcnow, kw_only=True)


@dataclass(frozen=True)
class CooperativeActivated(DomainEvent):
    cooperative_id: UUID
    actor_id: UUID


@dataclass(frozen=True)
class CooperativeDeactivated(DomainEvent):
    cooperative_id: UUID
    actor_id: UUID


@dataclass(frozen=True)
class CooperativeReactivated(DomainEvent):
    cooperative_id: UUID
    actor_id: UUID


@dataclass(frozen=True)
class CooperativeCompleted(DomainEvent):
    cooperative_id: UUID
    actor_id: UUID


@dataclass(frozen=True)
class CooperativeDissolved(DomainEvent):
    cooperative_id: UUID
    actor_id: UUID
    reason: str | None = None


@dataclass(frozen=True)
class RuleVersionCreated(DomainEvent):
    cooperative_id: UUID
    actor_id: UUID
    rule_type: str  # "governance" | "membership" | "financial" | "decision"
    version: int
    decision_type: str | None = None  # only set when rule_type == "decision"


@dataclass(frozen=True)
class GoalCreated(DomainEvent):
    goal_id: UUID
    cooperative_id: UUID
    actor_id: UUID


@dataclass(frozen=True)
class GoalContractCreated(DomainEvent):
    goal_id: UUID
    cooperative_id: UUID
    actor_id: UUID


@dataclass(frozen=True)
class GoalStatusChanged(DomainEvent):
    goal_id: UUID
    cooperative_id: UUID
    actor_id: UUID
    from_status: str
    to_status: str


@dataclass(frozen=True)
class OwnershipShareAdded(DomainEvent):
    goal_id: UUID
    cooperative_id: UUID
    actor_id: UUID
    user_id: UUID
    share_pct: float
