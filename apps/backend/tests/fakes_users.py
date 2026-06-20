from __future__ import annotations

from typing import Dict, List, Optional
from uuid import UUID

from src.domains.users.models import User


class FakeUserRepository:
    def __init__(self) -> None:
        self.users: Dict[UUID, User] = {}

    async def get_by_id(self, user_id: UUID) -> Optional[User]:
        return self.users.get(user_id)

    async def list(self, skip: int, limit: int) -> List[User]:
        return list(self.users.values())[skip : skip + limit]

    async def update(self, user: User) -> User:
        self.users[user.id] = user
        return user

    def seed(self, **overrides) -> User:
        from uuid import uuid4

        defaults = dict(
            id=uuid4(),
            username=f"user_{uuid4().hex[:6]}",
            email=f"{uuid4().hex[:6]}@coopwise.example",
            full_name="Test User",
            phone_number=None,
            is_email_verified=False,
            is_phone_verified=False,
            is_video_verified=False,
            wallet_activated=False,
            is_verified=False,
        )
        defaults.update(overrides)
        user = User(**defaults)
        self.users[user.id] = user
        return user
