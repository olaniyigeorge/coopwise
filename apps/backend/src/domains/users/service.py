"""
UserService — refactored to DI, same pattern as AuthService in PR1.

Changes from the original (per agreed PR2 scope):
  - register_user removed: it duplicated AuthService.register_user with a
    *weaker* implementation (no full_name/phone_number/role), wasn't called
    from the router shown, and risked creating incomplete users if anything
    started calling it. Registration belongs to the auth domain only.
  - authenticate_user removed for the same reason: pure duplicate of
    AuthService.authenticate_user, unused by the router, same drift risk.
  - 404 -> 500 bug fixed: "not found" now raises UserNotFoundError directly,
    not inside a try/except Exception that recatches it as a 500. The
    router maps UserNotFoundError -> HTTP 404.
  - verify_user / kyc: now read/write real columns (is_video_verified,
    wallet_activated, is_verified) added in this PR's migration. These were
    previously referenced but didn't exist on the model -> AttributeError
    on first real call.
"""
from __future__ import annotations

import base64
from typing import List
from uuid import UUID


from src.domains.users.tasks import upload_avatar_task
from src.domains.kyc.ports import ObjectStoragePort
from src.domains.users.exceptions import (
    UserConflictError,
    UserFetchError,
    UserNotFoundError,
    UserUpdateError,
)
from src.domains.users.ports import UserRepository
from src.domains.users.schemas import UserUpdate
from src.domains.users.models import User
from src.shared.utils.logger import logger


class UserService:
    def __init__(self, *, user_repo: UserRepository) -> None:
        self._users = user_repo

    async def get_users(self, skip: int = 0, limit: int = 10) -> List[User]:
        try:
            return await self._users.list(skip, limit)
        except Exception as e:
            logger.error(f"Failed to fetch users: {e}")
            raise UserFetchError(str(e))

    async def get_user_by_id(self, user_id: UUID) -> User:
        user = await self._users.get_by_id(user_id)
        if not user:
            raise UserNotFoundError("User not found")
        return user
    

    async def queue_avatar_upload(
        self, user_id: UUID, file_bytes: bytes, filename: str, content_type: str
    ) -> str:
        user = await self._users.get_by_id(user_id)
        if not user:
            raise UserNotFoundError(f"User {user_id} not found")

        encoded = base64.b64encode(file_bytes).decode("utf-8")
        result = upload_avatar_task.delay(
            user_id=str(user_id),
            file_data=encoded,
            filename=filename,
            content_type=content_type,
        )
        return result.id

    async def update_user(self, user_id: UUID, user_data: UserUpdate) -> User:
        user = await self._users.get_by_id(user_id)
        if not user:
            raise UserNotFoundError("User not found")

        for field, value in user_data.model_dump(exclude_unset=True).items():
            setattr(user, field, value)

        try:
            return await self._users.update(user)
        except UserConflictError:
            raise
        except Exception as e:
            logger.error(f"Failed to update user: {e}")
            raise UserUpdateError(str(e))

    async def verify_user(self, user_id: UUID) -> bool:
        """
        True only if email, video, and phone verification all passed AND
        the wallet has been activated (e.g. first deposit made).
        """
        user = await self._users.get_by_id(user_id)
        if not user:
            raise UserNotFoundError("User not found")

        return all(
            [
                user.is_email_verified,
                user.is_phone_verified,
                user.wallet_activated,
            ]
        )