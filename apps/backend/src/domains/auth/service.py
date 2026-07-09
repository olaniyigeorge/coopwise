"""
AuthService — Bring Your Own Auth (BYOA).

Three entrypoints, all converging on the same find-or-create + mint-
platform-tokens pattern:
  - request_otp / verify_otp   (phone or email, same code path)
  - sign_in_with_firebase      (Google via Firebase)

CHANGED vs the Crossmint-Auth version:
  - exchange_crossmint_session is GONE.
  - Wallet provisioning is fired as a background task AFTER tokens are
    minted, never inline. A Crossmint/wallet outage must never block
    login or registration — see _trigger_wallet_provisioning, which is
    deliberately fire-and-forget at the service boundary (the actual
    Celery task lives in infra/tasks.py, kept out of this file so
    AuthService has no Celery import either).
"""
from __future__ import annotations

import secrets
from datetime import timedelta
from typing import Callable, Optional
from uuid import uuid4

from src.domains.auth.exceptions import (
    FirebaseVerificationError,
    FullNameRequiredError,
    InvalidTokenTypeError,
    OtpInvalidOrExpiredError,
    TokenExpiredError,
    UserNotFoundError,
)
from src.domains.auth.ports import (
    AuthNotifierPort,
    ClockPort,
    FirebaseVerifierPort,
    OtpChannel,
    OtpSenderPort,
    OtpStorePort,
    TokenServicePort,
    UserRepository,
)
from src.domains.auth.schemas import (
    FirebaseSignIn,
    RequestOtp,
    SessionResponse,
    SessionUser,
    VerifyOtp,
)
from src.domains.users.models import User, UserRoles
from src.shared.utils.logger import logger

DEFAULT_ACCESS_TOKEN_TTL = timedelta(minutes=15)
DEFAULT_REFRESH_TOKEN_TTL = timedelta(days=30)


class AuthService:
    def __init__(
        self,
        *,
        user_repo: UserRepository,
        otp_store: OtpStorePort,
        otp_senders: dict[OtpChannel, OtpSenderPort],
        firebase_verifier: FirebaseVerifierPort,
        token_service: TokenServicePort,
        clock: ClockPort,
        notifier: Optional[AuthNotifierPort] = None,
        on_user_authenticated: Optional[Callable[[User, str], None]] = None,
    ) -> None:
        self._users = user_repo
        self._otp_store = otp_store
        self._otp_senders = otp_senders
        self._firebase = firebase_verifier
        self._tokens = token_service
        self._clock = clock
        self._notifier = notifier
        # Callback into infra/tasks.py's Celery dispatch. Injected rather
        # than imported so this file has zero Celery/infra dependency —
        # see dependencies.py wiring.
        self._on_user_authenticated = on_user_authenticated

    # --------------------------------------------------------------- OTP: phone/email
    async def request_otp(self, payload: RequestOtp) -> None:
        channel = OtpChannel(payload.channel)
        code = await self._otp_store.issue_code(channel, payload.identifier)
        sender = self._otp_senders[channel]
        await sender.send_otp(payload.identifier, code)

    async def verify_otp(self, payload: VerifyOtp) -> SessionResponse:
        channel = OtpChannel(payload.channel)
        ok = await self._otp_store.verify_and_consume(
            channel, payload.identifier, payload.code
        )
        if not ok:
            raise OtpInvalidOrExpiredError("Invalid or expired code")

        if channel == OtpChannel.phone:
            user = await self._users.get_by_phone_number(payload.identifier)
        else:
            user = await self._users.get_by_email(payload.identifier)

        is_new_user = user is None
        if user is None:
            if not payload.full_name:
                raise FullNameRequiredError(
                    "full_name is required to complete registration"
                )
            user = await self._provision_user(
                phone_number=payload.identifier if channel == OtpChannel.phone else None,
                email=payload.identifier if channel == OtpChannel.email else None,
                full_name=payload.full_name,
                is_phone_verified=channel == OtpChannel.phone,
                is_email_verified=channel == OtpChannel.email,
            )
        else:
            user = await self._mark_verified_if_needed(user, channel)

        return await self._issue_session(user, is_new_user)

    # ------------------------------------------------------------- Firebase / Google
    async def sign_in_with_firebase(self, payload: FirebaseSignIn) -> SessionResponse:
        try:
            identity = await self._firebase.verify_id_token(payload.firebase_id_token)
        except Exception as e:
            raise FirebaseVerificationError(str(e))

        user = await self._users.get_by_firebase_uid(identity.firebase_uid)
        if user is None and identity.email:
            # Soft fallback: same person may have previously registered via
            # email OTP, now signing in with Google for the first time.
            user = await self._users.get_by_email(identity.email)

        is_new_user = user is None
        if user is None:
            full_name = identity.full_name or payload.full_name
            if not full_name:
                raise FullNameRequiredError(
                    "full_name is required to complete registration"
                )
            user = await self._provision_user(
                phone_number=None,
                email=identity.email,
                full_name=full_name,
                is_phone_verified=False,
                is_email_verified=identity.email_verified,
                firebase_uid=identity.firebase_uid,
                profile_picture_url=identity.picture_url,
            )
        else:
            changed = False
            if user.firebase_uid is None:
                user.firebase_uid = identity.firebase_uid
                changed = True
            if identity.email and not user.is_email_verified and identity.email_verified:
                user.is_email_verified = True
                changed = True
            if changed:
                user = await self._users.update(user)

        return await self._issue_session(user, is_new_user)

    # --------------------------------------------------------------- session refresh
    async def refresh_platform_session(self, refresh_token: str) -> SessionResponse:
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

        return await self._issue_session(user, is_new_user=False)

    # ------------------------------------------------------------- provisioning
    async def _provision_user(
        self,
        *,
        phone_number: Optional[str],
        email: Optional[str],
        full_name: str,
        is_phone_verified: bool,
        is_email_verified: bool,
        firebase_uid: Optional[str] = None,
        profile_picture_url: Optional[str] = None,
    ) -> User:
        username = await self._generate_unique_username(email, phone_number)
        user = User(
            id=uuid4(),
            username=username,
            email=email,
            phone_number=phone_number,
            full_name=full_name,
            firebase_uid=firebase_uid,
            profile_picture_url=profile_picture_url,
            is_email_verified=is_email_verified,
            is_phone_verified=is_phone_verified,
            role=UserRoles.user,
        )
        user = await self._users.add(user)
        if self._notifier is not None:
            await self._notifier.notify_user_registered(user)
        return user

    async def _mark_verified_if_needed(self, user: User, channel: OtpChannel) -> User:
        changed = False
        if channel == OtpChannel.phone and not user.is_phone_verified:
            user.is_phone_verified = True
            changed = True
        if channel == OtpChannel.email and not user.is_email_verified:
            user.is_email_verified = True
            changed = True
        if changed:
            user = await self._users.update(user)
        return user

    async def _generate_unique_username(
        self, email: Optional[str], phone_number: Optional[str]
    ) -> str:
        if email:
            base = email.split("@")[0]
        elif phone_number:
            base = f"user_{phone_number[-8:]}"
        else:
            base = f"user_{secrets.token_hex(4)}"
        candidate = base.lower().replace(" ", "_").replace("+", "")
        # Collisions are rare but possible (shared email-local-part / phone
        # suffix), so always disambiguate with a short random suffix rather
        # than doing a uniqueness round-trip query here.
        return f"{candidate}_{secrets.token_hex(3)}"

    # ----------------------------------------------------------------- tokens
    async def _issue_session(self, user: User, is_new_user: bool) -> SessionResponse:
        access_token = await self._mint_access_token(user)
        refresh_token = await self._mint_refresh_token(user)

        if self._on_user_authenticated is not None:
            try:
                logger.info(f"[AuthService] dispatching wallet provisioning for user {user.id}" )
                self._on_user_authenticated(user, access_token)
            except Exception as e:
                # Wallet provisioning dispatch must NEVER fail a login.
                logger.error(f"[AuthService] wallet provisioning dispatch failed: {e}")

        return SessionResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            is_new_user=is_new_user,
            user=self._to_session_user(user),
        )

    async def _mint_access_token(self, user: User) -> str:
        claims = {
            "sub": user.email or user.phone_number,
            "id": str(user.id),
            "role": user.role.value,
            "onboarding_status": self._onboarding_status(user),
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
        """Informational only — onboarding is optional, never a gate."""
        required = (
            user.target_savings_amount,
            user.savings_purpose,
            user.income_range,
            user.saving_frequency,
        )
        return "complete" if all(f is not None for f in required) else "incomplete"

    def _to_session_user(self, user: User) -> SessionUser:
        return SessionUser(
            id=user.id,
            username=user.username,
            email=user.email,
            phone_number=user.phone_number,
            full_name=user.full_name,
            role=user.role,
            flow_address=user.flow_address,
            profile_picture_url=user.profile_picture_url,
            onboarding_status=self._onboarding_status(user),
        )