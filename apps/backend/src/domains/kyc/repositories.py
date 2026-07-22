from datetime import datetime
from typing import Optional
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from src.domains.kyc.schemas import KYCAdminListItem
from src.domains.kyc.models import (
    KYCIdDocumentType,
    KYCStatus,
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
                "identity_verification",
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
                selectinload(KYCVerification.identity_verification),
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
                selectinload(KYCVerification.identity_verification),
                selectinload(KYCVerification.banking_info),
            )
            .where(KYCVerification.user_id == user_id)
        )

        return await self._db.scalar(stmt)

    async def list_for_kyc(self, kyc_id: UUID) -> list[KYCAuditLog]:
        stmt = (
            select(KYCAuditLog)
            .where(KYCAuditLog.kyc_id == kyc_id)
            .order_by(KYCAuditLog.created_at.desc())
        )
        result = await self._db.execute(stmt)
        return result.scalars().all()
    
    async def list_submissions(
        self,
        status: Optional[KYCStatus],
        search: Optional[str],
        min_score: Optional[float],
        max_score: Optional[float],
        page: int,
        page_size: int,
    ) -> tuple[list[KYCVerification], int]:

        stmt = (
            select(KYCVerification)
            .outerjoin(KYCPersonalInfo, KYCPersonalInfo.kyc_verification_id == KYCVerification.id)
            .outerjoin(KYCBankingInfo, KYCBankingInfo.kyc_verification_id == KYCVerification.id)
            .options(
                selectinload(KYCVerification.personal_info),
                selectinload(KYCVerification.contact_info),
                selectinload(KYCVerification.identity_verification),
                selectinload(KYCVerification.banking_info),
            )
        )

        if status:
            stmt = stmt.where(KYCVerification.status == status)
        if search:
            like = f"%{search}%"
            stmt = stmt.where(KYCPersonalInfo.legal_full_name.ilike(like))
        if min_score is not None:
            stmt = stmt.where(KYCBankingInfo.account_name_match_score >= min_score)
        if max_score is not None:
            stmt = stmt.where(KYCBankingInfo.account_name_match_score <= max_score)

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = await self._db.scalar(count_stmt)

        stmt = (
            stmt.order_by(KYCVerification.submitted_at.desc().nullslast())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )

        result = await self._db.execute(stmt)
        rows = result.unique().scalars().all()
        return rows, total
    
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

    async def ensure_identity_exists(self, kyc_id: UUID) -> None:
        stmt = select(KYCIdentityVerification).where(
            KYCIdentityVerification.kyc_verification_id == kyc_id
        )

        instance = await self._db.scalar(stmt)

        if instance is not None:
            return

        self._db.add(
            KYCIdentityVerification(
                kyc_verification_id=kyc_id,
                document_type=KYCIdDocumentType.nin,  # temporary placeholder
                document_number_encrypted="",
                status=KYCStepStatus.pending,
            )
        )

        await self._db.flush()


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
    
    async def list_for_kyc(self, kyc_id: UUID) -> list[KYCAuditLog]:
        stmt = (
            select(KYCAuditLog)
            .where(KYCAuditLog.kyc_id == kyc_id)
            .order_by(KYCAuditLog.created_at.desc())
        )
        result = await self._session.execute(stmt)
        return result.scalars().all()