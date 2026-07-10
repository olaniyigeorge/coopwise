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

from src.domains.users.exceptions import (
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

    async def update_user(self, user_id: UUID, user_data: UserUpdate) -> User:
        user = await self._users.get_by_id(user_id)
        if not user:
            raise UserNotFoundError("User not found")

        for field, value in user_data.model_dump(exclude_unset=True).items():
            setattr(user, field, value)

        try:
            return await self._users.update(user)
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
                user.is_video_verified,
                user.is_phone_verified,
                user.wallet_activated,
            ]
        )

    async def kyc(
        self,
        user_id: UUID,
        *,
        video_verified: bool = False,
        email_verified: bool = False,
        wallet_activated: bool = False,
    ) -> dict:
        """
        Updates verification flags as part of KYC. is_verified is derived,
        not independently settable, so it can never drift from its inputs.
        """
        user = await self._users.get_by_id(user_id)
        if not user:
            raise UserNotFoundError("User not found")

        user.is_video_verified = video_verified or user.is_video_verified
        user.is_email_verified = email_verified or user.is_email_verified
        user.wallet_activated = wallet_activated or user.wallet_activated
        user.is_verified = all(
            [user.is_email_verified, user.is_video_verified, user.wallet_activated]
        )

        try:
            user = await self._users.update(user)
        except Exception as e:
            logger.error(f"KYC update failed: {e}")
            raise UserUpdateError(str(e))

        return {
            "status": "success",
            "is_verified": user.is_verified,
            "details": {
                "is_email_verified": user.is_email_verified,
                "is_video_verified": user.is_video_verified,
                "wallet_activated": user.wallet_activated,
            },
        }