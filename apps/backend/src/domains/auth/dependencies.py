from __future__ import annotations

from fastapi import Depends
from redis.asyncio.client import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from src.shared.utils.logger import logger
from config import AppConfig as config
from src.api.middlewares.dependencies import get_redis
from src.domains.auth.infra.firebase_verifier import FirebaseVerifier
from src.domains.auth.infra.jose_token_service import JoseTokenService
from src.domains.auth.infra.notifier_adapter import NotificationServiceAuthNotifier
from src.domains.auth.infra.otp_senders import (
    EmailOtpSender,
    NullOtpSender,
    SmsOtpSender,
)
from src.domains.auth.infra.otp_store import RedisOtpStore
from src.domains.auth.infra.sqlalchemy_user_repository import SqlAlchemyUserRepository
from src.domains.auth.infra.system_adapters import SystemClock
from src.domains.auth.infra.tasks import provision_wallet_task
from src.domains.auth.ports import OtpChannel
from src.domains.auth.service import AuthService
from src.infra.db.dependencies import get_async_db_session
from src.infra.emails.resend import get_email_sender

from src.infra.celery.app import celery_app

# No service account / private key needed — manual JWKS verification only
# needs the public Firebase project id. See infra/firebase_verifier.py.


def _build_otp_senders() -> dict[OtpChannel, object]:
    senders: dict[OtpChannel, object] = {}

    if getattr(config, "SMS_PROVIDER_API_KEY", None):
        senders[OtpChannel.phone] = SmsOtpSender(
            api_key=config.SMS_PROVIDER_API_KEY,
            sender_id=config.SMS_SENDER_ID,
            api_base_url=config.SMS_PROVIDER_BASE_URL,
        )
    else:
        # No SMS provider configured yet (decision pending) — fall back to
        # logging the code so the OTP flow is fully testable locally.
        senders[OtpChannel.phone] = NullOtpSender(OtpChannel.phone)

    # get_email_sender already branches dev (logs only) vs prod/staging
    # (real Resend send) internally, so EmailOtpSender is always wired the
    # same way here — no separate Null fallback needed at this layer.
    senders[OtpChannel.email] = EmailOtpSender(
        get_email_sender(
            environment=config.ENV,
            resend_api_key=getattr(config, "RESEND_API_KEY", None),
            from_email=getattr(config, "EMAIL_FROM_ADDRESS", None),
        )
    )

    return senders


_otp_senders = _build_otp_senders()
_firebase_verifier = FirebaseVerifier(project_id=config.FIREBASE_PROJECT_ID)


def _dispatch_wallet_provisioning(user, access_token: str) -> None:
    """Fire-and-forget Celery dispatch. Kept as a plain function (not a
    method) so it can be passed into AuthService as on_user_authenticated
    """
    logger.info(f"[_dispatch_wallet_provisioning] broker={celery_app.conf.broker_url!r} backend={celery_app.conf.result_backend!r}")
    try:
        logger.info(f"\n[_dispatch_wallet_provisioning] dispatching wallet provisioning for user {user.id}\n")
        provision_wallet_task.delay(str(user.id), access_token)
    except Exception as e:
        logger.error(f"[_dispatch_wallet_provisioning] failed to enqueue for {user.id}: {e}")
        # Don't let broker issues block sign-in — wallet provisioning
        # can be retried/reconciled later; auth should still succeed.

def get_auth_service(
    db: AsyncSession = Depends(get_async_db_session),
    redis: Redis = Depends(get_redis),
) -> AuthService:
    return AuthService(
        user_repo=SqlAlchemyUserRepository(db),
        otp_store=RedisOtpStore(redis),
        otp_senders=_otp_senders,
        firebase_verifier=_firebase_verifier,
        token_service=JoseTokenService(config.APP_SECRET_KEY, config.ALGORITHM),
        clock=SystemClock(),
        notifier=NotificationServiceAuthNotifier(db),
        on_user_authenticated=_dispatch_wallet_provisioning,
    )