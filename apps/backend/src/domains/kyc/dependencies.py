

from __future__ import annotations

from fastapi import Depends
from redis.asyncio.client import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from config import AppConfig as config
from src.domains.kyc.infra.bank_verification_provider import BankVerificationProvider
from src.domains.kyc.infra.identity_provider import IdentityVerificationProvider
from src.domains.kyc.infra.user_kyc_flag import UserKYCFlager
from src.domains.kyc.repositories import SqlAlchemyKYCRepository
from src.domains.kyc.infra.cloudinary_service import CloudinaryService
from src.infra.db.dependencies import get_async_db_session
from src.infra.security.field_encryptor import FieldEncryptor
from src.api.middlewares.dependencies import get_redis
from src.domains.kyc.infra.notifier_adapter import NotificationServiceKYCNotifier

from src.domains.kyc.service import KYCService


def get_kyc_service(
    db: AsyncSession = Depends(get_async_db_session),
    redis: Redis = Depends(get_redis),
) -> KYCService:
    return KYCService(
        repository=SqlAlchemyKYCRepository(db),
        encryptor=FieldEncryptor(config.SECRET_ENCRYPTION_KEY),
        notifier=NotificationServiceKYCNotifier(),
        identity_provider=IdentityVerificationProvider(),
        bank_provider=BankVerificationProvider(),
        storage=CloudinaryService(),
        user_flag_port=UserKYCFlager(),
    )