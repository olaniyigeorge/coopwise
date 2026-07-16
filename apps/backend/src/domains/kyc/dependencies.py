

from __future__ import annotations
import logging

from fastapi import Depends
from redis.asyncio.client import Redis
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from config import AppConfig as config

from src.domains.kyc.service import KYCService
from src.domains.kyc.audit_service import KYCAuditService
from src.domains.kyc.infra.bank_verification_provider import MockBankVerificationProvider
from src.domains.kyc.infra.identity_provider import HttpIdentityVerificationProvider, IdentityVerificationProvider
from src.domains.kyc.infra.user_kyc_flag import UserKYCFlager
from src.domains.kyc.repositories import SQLAlchemyKYCAuditRepository, SQLAlchemyKYCRepository
from src.domains.kyc.infra.cloudinary_storage import CloudinaryStorage
from src.infra.db.dependencies import get_async_db_session
from src.infra.security.field_encryptor import FieldEncryptor
from src.infra.cache.redis_client import get_redis
from src.domains.kyc.infra.notifier_adapter import NotificationServiceKYCNotifier




def get_kyc_service(
    db: AsyncSession = Depends(get_async_db_session),
    redis: Redis = Depends(get_redis),
) -> KYCService:
    return KYCService(
        repository=SQLAlchemyKYCRepository(db),
        encryptor=FieldEncryptor(config.SECRET_ENCRYPTION_KEY),
        notifier=NotificationServiceKYCNotifier(),
        identity_provider=IdentityVerificationProvider(),
        bank_provider=MockBankVerificationProvider(),
        storage=CloudinaryStorage(),
        user_flag_port=UserKYCFlager(),
    )

def get_kyc_audit_service(
        db_session: AsyncSession = Depends(get_async_db_session),
    ) -> KYCAuditService:
    return KYCAuditService(
        repo=SQLAlchemyKYCAuditRepository(db_session),
        logger=logging.getLogger("kyc.audit"),
    )


# Celery-context factory (separate from the FastAPI 
# Depends() factories above — different lifecycle)

_worker_service: KYCService | None = None

def build_kyc_service() -> KYCService:
    """For use inside Celery tasks only — not a FastAPI dependency. Lazily
    built on first task execution in a given worker process, never at
    import time, so each forked worker gets its own engine/connections."""
    global _worker_service
    if _worker_service is None:
        engine = create_async_engine(config.DATABASE_URL, pool_size=5, pool_pre_ping=True)
        session_factory = async_sessionmaker(engine, expire_on_commit=False)
        _worker_service = KYCService(
            repository=SQLAlchemyKYCRepository(session_factory),
            encryptor=FieldEncryptor(config.FIELD_ENCRYPTION_KEY),
            identity_provider=HttpIdentityVerificationProvider(config.IDENTITY_PROVIDER_BASE_URL),
            bank_provider=MockBankVerificationProvider(config.BANK_PROVIDER_BASE_URL),
            storage=CloudinaryStorage(),
            user_flag_port=UserKYCFlager(session_factory),
            notifier=NotificationServiceKYCNotifier(),
        )
    return _worker_service