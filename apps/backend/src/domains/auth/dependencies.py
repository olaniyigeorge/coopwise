from __future__ import annotations

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from config import AppConfig as config
from src.domains.auth.infra.jose_token_service import JoseTokenService
from src.domains.auth.infra.notifier_adapter import NotificationServiceAuthNotifier
from src.domains.auth.infra.sqlalchemy_user_repository import SqlAlchemyUserRepository
from src.domains.auth.infra.system_adapters import PasslibPasswordHasher, SystemClock
from src.domains.auth.service import AuthService
from src.infra.db.dependencies import get_async_db_session


def get_auth_service(
    db: AsyncSession = Depends(get_async_db_session),
) -> AuthService:
    return AuthService(
        user_repo=SqlAlchemyUserRepository(db),
        password_hasher=PasslibPasswordHasher(),
        token_service=JoseTokenService(config.APP_SECRET_KEY, config.ALGORITHM),
        clock=SystemClock(),
        notifier=NotificationServiceAuthNotifier(db),
        client_domain=config.CLIENT_DOMAIN,
    )
