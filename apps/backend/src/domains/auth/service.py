"""
AuthService — Crossmint-only identity, platform-issued sessions.

CHANGED vs the password-auth version:
  - register_user / authenticate_user / send_reset_password_link /
    confirm_reset_token / change_password are ALL GONE. There is no local
    credential to register, authenticate, or reset. (The known
    `UserRoles.USER` landmine documented in the old service died with it.)
  - flow_sync (driven by client-asserted iAuthWallet fields) is GONE —
    see exceptions.py / ports.py docstrings for why that was a spoofing
    hole. Replaced by exchange_crossmint_session, which only ever acts on
    identity fields that came back from CrossmintVerifierPort, i.e. fields
    WE derived from a cryptographically verified token, never fields the
    client handed us directly.
  - One core flow now: verify Crossmint session -> find-or-create local
    User by crossmint_user_id -> mint OUR platform access + refresh JWTs.
    Our platform JWT is what every other domain's get_current_user checks;
    Crossmint's JWT is never used as a bearer credential past this one
    exchange call, which limits the blast radius of a leaked Crossmint
    token (see PR discussion: "verify once, mint our own session").
"""
from __future__ import annotations

import secrets
from datetime import timedelta
from typing import Optional
from uuid import uuid4

from src.domains.auth.exceptions import (
    CrossmintVerificationError,
    InvalidTokenTypeError,
    TokenExpiredError,
    UserNotFoundError,
)
from src.domains.auth.ports import (
    AuthNotifierPort,
    ClockPort,
    CrossmintIdentity,
    CrossmintVerifierPort,
    TokenServicePort,
    UserRepository,
)
from src.domains.auth.schemas import CrossmintSessionExchange, SessionResponse, SessionUser
from src.domains.users.models import User, UserRoles
from src.shared.utils.logger import logger

DEFAULT_ACCESS_TOKEN_TTL = timedelta(minutes=15)
DEFAULT_REFRESH_TOKEN_TTL = timedelta(days=30)


class AuthService:
    def __init__(
        self,
        *,
        user_repo: UserRepository,
        crossmint_verifier: CrossmintVerifierPort,
        token_service: TokenServicePort,
        clock: ClockPort,
        notifier: Optional[AuthNotifierPort] = None,
    ) -> None:
        self._users = user_repo
        self._crossmint = crossmint_verifier
        self._tokens = token_service
        self._clock = clock
        self._notifier = notifier

    # --------------------------------------------------------- session exchange
    async def exchange_crossmint_session(
        self, payload: CrossmintSessionExchange
    ) -> SessionResponse:
        """
        The sole end-user auth entrypoint. Verifies the Crossmint session,
        provisions a local User on first sight, and returns OUR platform
        tokens. Never trusts anything except what verify_session() returns.
        """
        identity = await self._crossmint.verify_session(
            payload.crossmint_jwt, payload.crossmint_refresh_token
        )

        user = await self._users.get_by_crossmint_user_id(identity.crossmint_user_id)

        is_new_user = user is None
        if user is None:
            user = await self._provision_user(identity)
        else:
            user = await self._sync_profile_if_changed(user, identity)

        if is_new_user and self._notifier is not None:
            await self._notifier.notify_user_registered(user)

        access_token = await self._mint_access_token(user)
        refresh_token = await self._mint_refresh_token(user)

        return SessionResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=self._to_session_user(user),
        )

    async def refresh_platform_session(self, refresh_token: str) -> SessionResponse:
        """Exchange a still-valid platform refresh token for a new access token,
        without requiring the user to re-authenticate against Crossmint."""
        payload = self._tokens.decode(refresh_token)
        if payload.get("type") != "refresh":
            raise InvalidTokenTypeError("Not a refresh token")
        exp = payload.get("exp")
        if exp is not None and self._clock.now().timestamp() > float(exp):
            raise TokenExpiredError("Refresh token has expired")

        from uuid import UUID

        user = await self._users.get_by_id(UUID(payload["id"]))
        if not user:
            raise UserNotFoundError("User not found")

        access_token = await self._mint_access_token(user)
        new_refresh_token = await self._mint_refresh_token(user)
        return SessionResponse(
            access_token=access_token,
            refresh_token=new_refresh_token,
            user=self._to_session_user(user),
        )

    # ------------------------------------------------------------- provisioning
    async def _provision_user(self, identity: CrossmintIdentity) -> User:
        username = await self._generate_unique_username(identity)
        display_name = (
            identity.email.split("@")[0].replace(".", " ").title()
            if identity.email
            else "CoopWise User"
        )

        user = User(
            id=uuid4(),
            username=username,
            email=identity.email or f"{identity.crossmint_user_id}@crossmint.local",
            full_name=display_name,
            phone_number=identity.phone_number,
            crossmint_user_id=identity.crossmint_user_id,
            wallet_provider="crossmint",
            is_email_verified=bool(identity.email),
            is_phone_verified=bool(identity.phone_number),
            role=UserRoles.user,
        )
        try:
            return await self._users.add(user)
        except Exception as e:
            logger.error(f"Error provisioning user from Crossmint identity: {e}")
            raise CrossmintVerificationError(
                "Could not provision a local account for this Crossmint session"
            )

    async def _generate_unique_username(self, identity: CrossmintIdentity) -> str:
        base = (
            identity.email.split("@")[0]
            if identity.email
            else f"user_{identity.crossmint_user_id[-8:]}"
        )
        candidate = base.lower().replace(" ", "_")
        # Crossmint user IDs are stable and unique, so collisions here are
        # rare (shared email-local-part), but we still guard against them.
        existing = await self._users.get_by_email(identity.email) if identity.email else None
        if existing is None:
            return candidate
        return f"{candidate}_{secrets.token_hex(3)}"

    async def _sync_profile_if_changed(
        self, user: User, identity: CrossmintIdentity
    ) -> User:
        """Keep local copies of email/phone fresh if Crossmint's profile changed.
        Never touches crossmint_user_id once set — that's the immutable join key."""
        changed = False
        if identity.email and user.email != identity.email:
            user.email = identity.email
            user.is_email_verified = True
            changed = True
        if identity.phone_number and user.phone_number != identity.phone_number:
            user.phone_number = identity.phone_number
            user.is_phone_verified = True
            changed = True
        if changed:
            user = await self._users.update(user)
        return user

    # ----------------------------------------------------------------- tokens
    async def _mint_access_token(self, user: User) -> str:
        onboarding_status = self._onboarding_status(user)
        claims = {
            "sub": user.email,
            "id": str(user.id),
            "role": user.role.value,
            "onboarding_status": onboarding_status,
            "type": "access",
        }
        return await self._encode(claims, DEFAULT_ACCESS_TOKEN_TTL)

    async def _mint_refresh_token(self, user: User) -> str:
        claims = {"id": str(user.id), "type": "refresh"}
        return await self._encode(claims, DEFAULT_REFRESH_TOKEN_TTL)

    async def _encode(self, claims: dict, ttl: timedelta) -> str:
        to_encode = claims.copy()
        to_encode["exp"] = self._clock.now() + ttl
        return self._tokens.encode(to_encode, ttl)

    async def decode_token(self, token: str) -> dict:
        return self._tokens.decode(token)

    # ----------------------------------------------------------------- helpers
    @staticmethod
    def _onboarding_status(user: User) -> str:
        """Informational only — onboarding is optional, never enforced as a
        gate (see product decision). Frontend uses this to decide whether to
        nudge the user toward profile-setup, not to block access."""
        required_fields = (
            user.target_savings_amount,
            user.savings_purpose,
            user.income_range,
            user.saving_frequency,
        )
        return "complete" if all(f is not None for f in required_fields) else "incomplete"

    def _to_session_user(self, user: User) -> SessionUser:
        return SessionUser(
            id=user.id,
            username=user.username,
            email=user.email,
            full_name=user.full_name,
            phone_number=user.phone_number,
            role=user.role,
            flow_address=user.flow_address,
            crossmint_user_id=user.crossmint_user_id,
            profile_picture_url=user.profile_picture_url,
            onboarding_status=self._onboarding_status(user),
        )