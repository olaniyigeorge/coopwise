from __future__ import annotations

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from config import AppConfig as config
from src.domains.auth.infra.crossmint_verifier import CrossmintVerifier
from src.domains.auth.infra.jose_token_service import JoseTokenService
from src.domains.auth.infra.notifier_adapter import NotificationServiceAuthNotifier
from src.domains.auth.infra.sqlalchemy_user_repository import SqlAlchemyUserRepository
from src.domains.auth.infra.system_adapters import SystemClock
from src.domains.auth.service import AuthService
from src.infra.db.dependencies import get_async_db_session

# Single shared verifier instance: holds a pooled httpx.AsyncClient and a
# JWKS cache (TTL'd in-process), so we don't re-fetch Crossmint's JWKS or
# spin up a new HTTP client on every request.
_crossmint_verifier = CrossmintVerifier(
    server_api_key=config.CROSSMINT_SERVER_API_KEY,
    audience=config.CROSSMINT_AUDIENCE,
)


def get_auth_service(
    db: AsyncSession = Depends(get_async_db_session),
) -> AuthService:
    return AuthService(
        user_repo=SqlAlchemyUserRepository(db),
        crossmint_verifier=_crossmint_verifier,
        token_service=JoseTokenService(config.APP_SECRET_KEY, config.ALGORITHM),
        clock=SystemClock(),
        notifier=NotificationServiceAuthNotifier(db),
    )