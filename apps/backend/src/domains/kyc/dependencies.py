from __future__ import annotations
import logging

from contextlib import asynccontextmanager
from fastapi import Depends
from redis.asyncio.client import Redis
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from config import AppConfig as config
from src.infra.storage.cloudinary_storage import CloudinaryStorage
from src.infra.db.dependencies import get_async_db_session
from src.infra.security.field_encryptor import FieldEncryptor
from src.infra.cache.redis_client import get_redis
from src.domains.kyc.service import KYCService
from src.domains.kyc.audit_service import KYCAuditService
from src.domains.kyc.infra.bank_verification_provider import MockBankVerificationProvider
from src.domains.kyc.infra.identity_provider import MockIdentityVerificationProvider
from src.domains.kyc.infra.user_kyc_flag import UserKYCFlager
from src.domains.kyc.repositories import SQLAlchemyKYCAuditRepository, SQLAlchemyKYCRepository
from src.domains.kyc.infra.notifier_adapter import NotificationServiceKYCNotifier


def get_kyc_service(
    db: AsyncSession = Depends(get_async_db_session),
    redis: Redis = Depends(get_redis),
) -> KYCService:
    return KYCService(
        repository=SQLAlchemyKYCRepository(db),
        audit_repository=SQLAlchemyKYCAuditRepository(db),
        encryptor=FieldEncryptor(config.SECRET_ENCRYPTION_KEY),
        notifier=NotificationServiceKYCNotifier(),
        identity_provider=MockIdentityVerificationProvider(),
        bank_provider=MockBankVerificationProvider(),
        storage=CloudinaryStorage(),
        user_flag_port=UserKYCFlager(db),
    )

def get_kyc_audit_service(
        db_session: AsyncSession = Depends(get_async_db_session),
    ) -> KYCAuditService:
    return KYCAuditService(
        repo=SQLAlchemyKYCAuditRepository(db_session),
        logger=logging.getLogger("kyc.audit"),
    )





# Cached once per worker process — expensive to build, safe to share
_engine = None
_session_factory: async_sessionmaker | None = None


def _get_session_factory() -> async_sessionmaker:
    global _engine, _session_factory
    if _session_factory is None:
        _engine = create_async_engine(config.DATABASE_URL, pool_size=5, pool_pre_ping=True)
        _session_factory = async_sessionmaker(_engine, expire_on_commit=False)
    return _session_factory


@asynccontextmanager
async def build_kyc_service():
    """For use inside Celery tasks only — not a FastAPI dependency.
    Opens a fresh AsyncSession per task invocation (never held across
    tasks), builds a KYCService around it, and commits/rolls back on exit."""
    session_factory = _get_session_factory()
    async with session_factory() as session:
        service = KYCService(
            repository=SQLAlchemyKYCRepository(session),
            audit_repository=SQLAlchemyKYCAuditRepository(session),
            encryptor=FieldEncryptor(config.SECRET_ENCRYPTION_KEY),
            identity_provider=MockIdentityVerificationProvider(),
            bank_provider=MockBankVerificationProvider(),
            storage=CloudinaryStorage(),
            user_flag_port=UserKYCFlager(session),
            notifier=NotificationServiceKYCNotifier(),
        )
        try:
            yield service
            await session.commit()
        except Exception:
            await session.rollback()
            raise