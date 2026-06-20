from __future__ import annotations

from typing import List, Optional, Protocol
from uuid import UUID

from src.domains.users.models import User


class UserRepository(Protocol):
    async def get_by_id(self, user_id: UUID) -> Optional[User]: ...

    async def list(self, skip: int, limit: int) -> List[User]: ...

    async def update(self, user: User) -> User:
        """Persist mutations to an already-attached user."""
        ...
