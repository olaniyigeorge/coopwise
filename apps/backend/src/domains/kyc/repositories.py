from datetime import datetime
from typing import Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from src.domains.kyc.models import (
    KYCVerification,
    KYCPersonalInfo,
    KYCContactInfo,
    KYCIdentityVerification,
    KYCBankingInfo,
    KYCStepStatus,
    KYCStepType,
)
from src.domains.kyc.audit_models import KYCAuditLog

from src.domains.kyc.ports import KYCRepositoryPort



class SQLAlchemyKYCRepository(KYCRepositoryPort):
    _STEP_MODEL = {
        KYCStepType.personal_info: KYCPersonalInfo,
        KYCStepType.contact_info: KYCContactInfo,
        KYCStepType.identity_verification: KYCIdentityVerification,
        KYCStepType.banking_info: KYCBankingInfo,
    }

    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def create(
        self,
        user_id: UUID,
    ) -> Optional[KYCVerification]:
        kyc = KYCVerification(
            user_id=user_id,
        )

        self._db.add(kyc)
        await self._db.flush()

        await self._db.refresh(
            kyc,
            attribute_names=[
                "personal_info",
                "contact_info",
                "identity",
                "banking_info",
            ],
        )

        return kyc
    
    async def get_by_id(
        self,
        kyc_id: UUID,
    ) -> Optional[KYCVerification]:

        stmt = (
            select(KYCVerification)
            .options(
                selectinload(KYCVerification.personal_info),
                selectinload(KYCVerification.contact_info),
                selectinload(KYCVerification.identity),
                selectinload(KYCVerification.banking_info),
            )
            .where(KYCVerification.id == kyc_id)
        )

        return await self._db.scalar(stmt)

    async def get_by_user_id(
        self,
        user_id: UUID,
    ) -> Optional[KYCVerification]:

        stmt = (
            select(KYCVerification)
            .options(
                selectinload(KYCVerification.personal_info),
                selectinload(KYCVerification.contact_info),
                selectinload(KYCVerification.identity),
                selectinload(KYCVerification.banking_info),
            )
            .where(KYCVerification.user_id == user_id)
        )

        return await self._db.scalar(stmt)

    async def _upsert(
        self,
        model,
        kyc_id: UUID,
        data: dict,
    ):
        stmt = select(model).where(
            model.kyc_verification_id == kyc_id
        )

        instance = await self._db.scalar(stmt)

        if instance is None:
            instance = model(
                kyc_verification_id=kyc_id,
                **data,
            )

            self._db.add(instance)

        else:
            for key, value in data.items():
                setattr(instance, key, value)

        await self._db.flush()

        return instance

    async def upsert_personal_info(
        self,
        kyc_id: UUID,
        data: dict,
    ) -> None:

        await self._upsert(
            KYCPersonalInfo,
            kyc_id,
            data,
        )

    async def upsert_contact_info(
        self,
        kyc_id: UUID,
        data: dict,
    ) -> None:

        await self._upsert(
            KYCContactInfo,
            kyc_id,
            data,
        )

    async def upsert_identity(
        self,
        kyc_id: UUID,
        data: dict,
    ) -> None:

        await self._upsert(
            KYCIdentityVerification,
            kyc_id,
            data,
        )

    async def upsert_banking_info(
        self,
        kyc_id: UUID,
        data: dict,
    ) -> None:

        await self._upsert(
            KYCBankingInfo,
            kyc_id,
            data,
        )

    async def set_step_status(
        self,
        kyc_id: UUID,
        step: KYCStepType,
        status: KYCStepStatus,
        rejection_reason: Optional[str] = None,
    ) -> None:

        model = self._STEP_MODEL[step]

        stmt = select(model).where(
            model.kyc_verification_id == kyc_id
        )

        instance = await self._db.scalar(stmt)

        if instance is None:
            raise ValueError(
                f"{step.value} has not been created"
            )

        instance.status = status
        instance.rejection_reason = rejection_reason

        if status == KYCStepStatus.submitted:
            instance.submitted_at = datetime.utcnow()

        await self._db.flush()

    async def set_overall_status(
        self,
        kyc_id: UUID,
        **fields,
    ) -> KYCVerification:

        kyc = await self.get_by_id(kyc_id)

        if kyc is None:
            raise ValueError("KYC not found")

        for key, value in fields.items():
            setattr(
                kyc,
                key,
                value,
            )

        await self._db.flush()

        return kyc

    async def find_by_provider_reference(
        self,
        reference_id: str,
    ) -> Optional[KYCVerification]:

        stmt = (
            select(KYCVerification)
            .join(KYCIdentityVerification)
            .where(
                KYCIdentityVerification.provider_reference_id
                == reference_id
            )
        )

        return await self._db.scalar(stmt)
    



class SQLAlchemyKYCAuditRepository:
    def __init__(self, session: AsyncSession):
        self._session = session

    async def create(self, *, kyc_id, admin_id, action, step, reason, metadata, ip_address, user_agent):
        entry = KYCAuditLog(
            kyc_id=kyc_id, admin_id=admin_id, action=action, step=step,
            reason=reason, metadata_=metadata, ip_address=ip_address, user_agent=user_agent,
        )
        self._session.add(entry)
        await self._session.commit()
        return entry