"""
AuthService — refactored to dependency injection.

Behavior is intentionally IDENTICAL to the pre-refactor static-method
version (including its one known landmine, flagged below) — this PR is
structure-only. Bug fixes land in PR2 so the diff here stays reviewable
and the test suite can assert "nothing changed" before "things improve".

Known landmine carried over from the old code (see PR2):
    register_user falls back to `UserRoles.USER` (uppercase) if
    user_data.role is falsy. That enum member doesn't exist — it would
    raise AttributeError. It hasn't fired yet because UserCreate already
    defaults `role` to UserRoles.user. Left as-is here on purpose.
"""
from __future__ import annotations

import secrets
from datetime import timedelta
from typing import Optional
from uuid import uuid4

from src.domains.auth.exceptions import (
    EmailAlreadyRegisteredError,
    InvalidTokenTypeError,
    PhoneNumberAlreadyRegisteredError,
    TokenExpiredError,
    UserCreationError,
    UserNotFoundError,
    UsernameAlreadyRegisteredError,
)
from src.domains.auth.ports import (
    AuthNotifierPort,
    ClockPort,
    PasswordHasherPort,
    TokenServicePort,
    UserRepository,
)
from src.domains.auth.schemas import AuthenticatedUser
from src.domains.users.models import User, UserRoles
from src.domains.users.schemas import UserCreate, iAuthWallet
from src.shared.utils.logger import logger

DEFAULT_ACCESS_TOKEN_TTL = timedelta(minutes=30)
DEFAULT_RESET_TOKEN_TTL = timedelta(minutes=15)
DEFAULT_WALLET_TOKEN_TTL = timedelta(hours=24)


class AuthService:
    def __init__(
        self,
        *,
        user_repo: UserRepository,
        password_hasher: PasswordHasherPort,
        token_service: TokenServicePort,
        clock: ClockPort,
        notifier: Optional[AuthNotifierPort] = None,
        client_domain: str = "",
    ) -> None:
        self._users = user_repo
        self._hasher = password_hasher
        self._tokens = token_service
        self._clock = clock
        self._notifier = notifier
        self._client_domain = client_domain

    # -------------------------------------------------------------- register
    async def register_user(self, user_data: UserCreate) -> User:
        if await self._users.get_by_email(user_data.email):
            raise EmailAlreadyRegisteredError("Email already registered")

        username = user_data.username or user_data.email.split("@")[0]
        if await self._users.get_by_username(username):
            raise UsernameAlreadyRegisteredError("Username already registered")

        if await self._users.get_by_phone_number(user_data.phone_number):
            raise PhoneNumberAlreadyRegisteredError("Phone number already registered")

        try:
            new_user = User(
                username=username,
                email=user_data.email,
                password=self._hasher.hash(user_data.password),
                full_name=user_data.full_name,
                phone_number=user_data.phone_number,
                role=user_data.role or UserRoles.USER,  # noqa: see module docstring
                target_savings_amount=user_data.target_savings_amount or None,
                savings_purpose=user_data.savings_purpose or None,
                income_range=user_data.income_range or None,
                saving_frequency=user_data.saving_frequency or None,
            )
            new_user = await self._users.add(new_user)
        except (
            EmailAlreadyRegisteredError,
            UsernameAlreadyRegisteredError,
            PhoneNumberAlreadyRegisteredError,
        ):
            raise
        except Exception as e:
            logger.error(f"Error creating user: {e}")
            raise UserCreationError(str(e))

        if self._notifier is not None:
            await self._notifier.notify_user_registered(new_user)

        return new_user

    # ------------------------------------------------------------ authenticate
    async def authenticate_user(self, email: str, password: str) -> Optional[User]:
        user = await self._users.get_by_email(email)
        if not user or not self._hasher.verify(password, user.password):
            return None
        return user

    # ----------------------------------------------------------------- tokens
    async def create_access_token(
        self, data: dict, expires_delta: timedelta = DEFAULT_ACCESS_TOKEN_TTL
    ) -> str:
        to_encode = data.copy()
        expire = self._clock.now() + expires_delta
        to_encode["exp"] = expire
        return self._tokens.encode(to_encode, expires_delta)

    async def decode_token(self, token: str) -> dict:
        return self._tokens.decode(token)

    async def create_password_reset_token(
        self, user: User, expires_delta: timedelta = DEFAULT_RESET_TOKEN_TTL
    ) -> str:
        data = {
            "sub": user.email,
            "id": str(user.id),
            "username": user.username,
            "full_name": user.full_name,
            "role": user.role.value,
            "type": "reset",
        }
        expire = self._clock.now() + expires_delta
        logger.info(f"Reset token will expire at: {expire}")
        data["exp"] = expire
        return self._tokens.encode(data, expires_delta)

    # -------------------------------------------------------------- password reset
    async def send_reset_password_link(self, email: str) -> dict:
        user = await self._users.get_by_email(email)
        if not user:
            raise UserNotFoundError("User with this email does not exist")

        token = await self.create_password_reset_token(user)
        reset_link = f"{self._client_domain}/reset-password?token={token}"

        logger.info(f"\nToken: {token}\n")  # noqa: see PR2 — secret leak, kept as-is
        _ = reset_link  # would be passed to an email port in PR2
        return {"message": "Password reset link has been sent to your email"}

    async def confirm_reset_token(self, token: str) -> dict:
        payload = self._tokens.decode(token)
        if payload.get("type") != "reset":
            raise InvalidTokenTypeError("Invalid token type")
        exp = payload.get("exp")
        if exp is not None and self._clock.now().timestamp() > float(exp):
            raise TokenExpiredError("Token has expired")
        return payload

    async def change_password(self, token: str, new_password: str) -> dict:
        from uuid import UUID

        payload = await self.confirm_reset_token(token)
        user = await self._users.get_by_id(UUID(payload["id"]))
        if not user:
            raise UserNotFoundError("User not found")

        user.password = self._hasher.hash(new_password)
        user = await self._users.update(user)
        return {
            "status": "success",
            "message": "Password changed successfully",
            "user": user,
        }

    # ---------------------------------------------------------------- wallet sync
    async def flow_sync(
        self, data: iAuthWallet, current_user: Optional[AuthenticatedUser]
    ) -> dict:
        """
        Upsert a Crossmint-authenticated user and return a signed JWT.

        Lookup priority: crossmint_user_id -> email -> create new.
        (camp_sync removed in this PR — flow_sync is the sole live path.)
        """
        user: Optional[User] = None

        if data.crossmint_user_id:
            user = await self._users.get_by_crossmint_user_id(data.crossmint_user_id)

        if user is None and data.email:
            user = await self._users.get_by_email(data.email)

        if user is None:
            username_base = data.flow_address[-8:].lower()
            username = f"user_{username_base}"

            if await self._users.get_by_username(username):
                username = f"user_{secrets.token_hex(4)}"

            display_name = (
                data.email.split("@")[0].replace(".", " ").title()
                if data.email
                else "CoopWise User"
            )

            user = User(
                id=uuid4(),
                username=username,
                email=data.email or f"{data.crossmint_user_id}@crossmint.local",
                password=None,
                full_name=display_name,
                phone_number=None,
                crossmint_user_id=data.crossmint_user_id,
                flow_address=data.flow_address,
                wallet_provider=data.wallet_provider or "crossmint",
                is_email_verified=bool(data.email),
                role=UserRoles.user,
            )
            user = await self._users.add(user)
        else:
            if user.crossmint_user_id is None:
                user.crossmint_user_id = data.crossmint_user_id
            if user.flow_address != data.flow_address:
                user.flow_address = data.flow_address
            if user.wallet_provider is None:
                user.wallet_provider = data.wallet_provider or "crossmint"
            user = await self._users.update(user)

        if self._notifier is not None:
            await self._notifier.notify_wallet_linked(user, data.flow_address)

        token = await self.create_access_token(
            {
                "sub": user.email,
                "id": str(user.id),
                "role": user.role.value,
                "flow_address": user.flow_address,
            }
        )

        return {
            "access_token": token,
            "user": {
                "id": str(user.id),
                "email": user.email,
                "full_name": user.full_name,
                "username": user.username,
                "role": user.role.value,
                "flow_address": user.flow_address,
                "crossmint_user_id": user.crossmint_user_id,
                "wallet_provider": user.wallet_provider,
                "is_email_verified": user.is_email_verified,
                "phone_number": user.phone_number,
                "profile_picture_url": user.profile_picture_url,
            },
        }
