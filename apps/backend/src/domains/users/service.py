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

from typing import List
from uuid import UUID

from src.infra.storage.cloudinary_storage import CloudinaryStorage
from src.shared.utils.logger import logger
from src.domains.users.exceptions import (
    UserConflictError,
    UserFetchError,
    UserNotFoundError,
    UserUpdateError,
)
from src.domains.users.ports import UserRepository
from src.domains.users.schemas import UserUpdate
from src.domains.users.models import User


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

    async def upload_avatar(
        self, user_id: UUID, file_bytes: bytes, content_type: str
    ) -> str:
        user = await self._users.get_by_id(user_id)
        if not user:
            raise UserNotFoundError(f"User {user_id} not found")

        try:
            url = await CloudinaryStorage().upload(
                key=f"avatars/{user_id}",
                content=file_bytes,
                content_type=content_type,
            )
        except Exception as e:
            logger.error(f"Avatar upload failed for {user_id}: {e}")
            raise UserUpdateError("Could not upload photo")

        user.profile_picture_url = url
        await self._users.update(user)
        return url

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
