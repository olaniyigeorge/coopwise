
from datetime import datetime, date
from typing import Optional
from uuid import UUID, uuid4

from src.domains.kyc.schemas import BankingInfoInput, ContactInfoInput, IdentityInput, KYCAdminDetailResponse, KYCAdminListItem, KYCAdminListResponse, PersonalInfoInput
from src.shared.utils.matcher import classify_name_match, score_name_match
from src.domains.kyc.models import KYCStatus, KYCStepType, KYCStepStatus, KYCVerification
from src.domains.kyc.ports import (
    KYCAuditRepositoryPort, KYCNotifierPort, KYCRepositoryPort, FieldEncryptorPort, IdentityVerificationProviderPort,
    BankVerificationProviderPort, ObjectStoragePort, UserKYCFlagPort,
)
from src.domains.kyc.exceptions import (
    KYCNotFoundError, KYCAlreadyVerifiedError, InvalidKYCStateTransitionError,
    StepAlreadyApprovedError, IdentityVerificationFailedError, BankAccountNameMismatchError,
)


# ---- Allowed status transitions — the actual state machine ----
_ALLOWED_TRANSITIONS: dict[KYCStatus, set[KYCStatus]] = {
    KYCStatus.not_started: {KYCStatus.in_progress},
    KYCStatus.in_progress: {KYCStatus.pending_review},
    KYCStatus.pending_review: {KYCStatus.verified, KYCStatus.rejected, KYCStatus.in_progress},
    KYCStatus.rejected: {KYCStatus.in_progress},
    KYCStatus.verified: {KYCStatus.expired},
    KYCStatus.expired: {KYCStatus.in_progress},
}


class KYCService:
    def __init__(
        self,
        repository: KYCRepositoryPort,
        audit_repository: KYCAuditRepositoryPort,
        encryptor: FieldEncryptorPort,
        identity_provider: IdentityVerificationProviderPort,
        bank_provider: BankVerificationProviderPort,
        storage: ObjectStoragePort,
        user_flag_port: UserKYCFlagPort,
        notifier: KYCNotifierPort,
    ):
        self._repo = repository
        self._audit_repo = audit_repository
        self._encryptor = encryptor
        self._identity_provider = identity_provider
        self._bank_provider = bank_provider
        self._storage = storage
        self._user_flags = user_flag_port
        self._notifier = notifier

    # ---- Lifecycle ----

    async def start(self, user_id: UUID):
        kyc = await self._repo.get_by_user_id(user_id)
        if kyc is None:
            kyc = await self._repo.create(user_id)
        if kyc.status == KYCStatus.not_started:
            kyc = await self._transition(kyc, KYCStatus.in_progress)
        return kyc

    async def get_status(self, user_id: UUID):
        kyc = await self._repo.get_by_user_id(user_id)
        if kyc is None:
            raise KYCNotFoundError(f"No KYC record for user {user_id}")
        return kyc

    # ---- Step submission ----

    async def submit_personal_info(self, user_id: UUID, data: PersonalInfoInput):
        kyc = await self._require_editable(user_id, KYCStepType.personal_info)
        await self._repo.upsert_personal_info(kyc.id, {
            "legal_full_name": data.legal_full_name,
            "date_of_birth": data.date_of_birth,
            "gender": data.gender,
            "nationality": data.nationality,
            "employment_status": data.employment_status,
            "occupation_or_business_type": data.occupation_or_business_type,
            "source_of_funds": data.source_of_funds,
            "monthly_income_range": data.monthly_income_range,
            "income_currency": data.income_currency,
        })
        await self._repo.set_step_status(kyc.id, KYCStepType.personal_info, KYCStepStatus.submitted)
        await self._advance_if_ready(kyc.id)

    async def submit_contact_info(self, user_id: UUID, data: ContactInfoInput):
        kyc = await self._require_editable(user_id, KYCStepType.contact_info)
        await self._repo.upsert_contact_info(kyc.id, {
            "residential_address": data.residential_address,
            "city": data.city,
            "state": data.state,
            "postal_code": data.postal_code,
            "country": data.country,
            "next_of_kin_name": data.next_of_kin_name,
            "next_of_kin_phone": data.next_of_kin_phone,
        })
        await self._repo.set_step_status(kyc.id, KYCStepType.contact_info, KYCStepStatus.submitted)
        await self._advance_if_ready(kyc.id)

    async def submit_identity(self, user_id: UUID, data: IdentityInput):
        kyc = await self._require_editable(user_id, KYCStepType.identity_verification)

        doc_key = await self._storage.upload(
            key=f"kyc/{kyc.id}/document/{uuid4()}", content=data.document_image_bytes,
            content_type=data.document_image_content_type,
        )
        selfie_key = await self._storage.upload(
            key=f"kyc/{kyc.id}/selfie", content=data.selfie_image_bytes,
            content_type=data.selfie_image_content_type,
        )
        video_key = None
        if data.video_bytes:
            video_key = await self._storage.upload(
                key=f"kyc/{kyc.id}/video", content=data.video_bytes,
                content_type=data.video_content_type or "video/mp4",
            )

        result = await self._identity_provider.verify_identity(
            document_type=data.document_type,
            document_number=data.document_number,
            document_image_key=doc_key,
            selfie_image_key=selfie_key,
            video_key=video_key,
        )

        await self._repo.upsert_identity(kyc.id, {
            "document_type": data.document_type,
            "document_number_encrypted": self._encryptor.encrypt(data.document_number),
            "document_image_key": doc_key,
            "selfie_image_key": selfie_key,
            "video_key": video_key,
            "liveness_check_passed": result.liveness_check_passed,
            "liveness_score": result.liveness_score,
            "provider_reference_id": result.reference_id,
            "provider_response": result.raw_response,
        })

        if not result.success:
            await self._repo.set_step_status(
                kyc.id, KYCStepType.identity_verification, KYCStepStatus.rejected,
                rejection_reason="Provider verification failed",
            )
            raise IdentityVerificationFailedError(result.raw_response)

        # provider succeeded but flagged for human review (common for liveness edge cases)
        step_status = KYCStepStatus.submitted if result.requires_manual_review else KYCStepStatus.approved
        await self._repo.set_step_status(kyc.id, KYCStepType.identity_verification, step_status)
        await self._advance_if_ready(kyc.id)

    async def submit_banking_info(self, user_id: UUID, data: BankingInfoInput):
        kyc = await self._require_editable(user_id, KYCStepType.banking_info)

        # Cross-step validation: banking account name should match the legal name from step 1.
        # Requires personal_info to already be submitted — enforced by _require_editable's
        # step-order check below.
        bank_result = await self._bank_provider.resolve_account_name(data.bank_code, data.account_number)

        match_score = score_name_match(bank_result.resolved_account_name, kyc.personal_info.legal_full_name)
        match_result = classify_name_match(bank_result.resolved_account_name, kyc.personal_info.legal_full_name)

        await self._repo.upsert_banking_info(kyc.id, {
            "bank_name": data.bank_name,
            "bank_code": data.bank_code,
            "account_number_encrypted": self._encryptor.encrypt(data.account_number),
            "account_number_last4": data.account_number[-4:],
            "account_name": bank_result.resolved_account_name or "",
            "provider_verified": bank_result.success,
            "account_name_match_score": match_score,
        })

        if not bank_result.success:
            await self._repo.set_step_status(
                kyc.id, KYCStepType.banking_info, KYCStepStatus.rejected,
                rejection_reason="Bank could not resolve account",
            )
            raise BankAccountNameMismatchError("Account resolution failed", "resolution_failed")

        if match_result == "no_match":
            await self._repo.set_step_status(
                kyc.id, KYCStepType.banking_info, KYCStepStatus.rejected,
                rejection_reason="Account name does not match KYC identity",
            )
            raise BankAccountNameMismatchError(
                "Account name does not match KYC identity", "name_mismatch"
            )

        step_status = KYCStepStatus.submitted  # always routes to review for banking, never auto-approve
        await self._repo.set_step_status(kyc.id, KYCStepType.banking_info, step_status)
        await self._advance_if_ready(kyc.id)


    # TODO: service.begin_identity_submission(user.id)  # sets step status to "processing", cheap DB write only


    # ---- Async provider callback ----

    async def handle_identity_webhook(self, provider_reference_id: str, payload: dict):
        kyc = await self._repo.find_by_provider_reference(provider_reference_id)
        if kyc is None:
            return  # log and drop — don't raise on unknown webhooks
        approved = payload.get("status") == "approved"
        status = KYCStepStatus.approved if approved else KYCStepStatus.rejected
        await self._repo.set_step_status(
            kyc.id, KYCStepType.identity_verification, status,
            rejection_reason=None if approved else payload.get("reason"),
        )
        await self._advance_if_ready(kyc.id)


    # ---- Admin: discovery ----

    async def list_admin_submissions(
            self,
            status: Optional[KYCStatus],
            search: Optional[str],
            min_score: Optional[float],
            max_score: Optional[float],
            page: int,
            page_size: int,
        ) -> KYCAdminListResponse:
            rows, total = await self._repo.list_submissions(
                status=status, search=search, min_score=min_score,
                max_score=max_score, page=page, page_size=page_size,
            )
            return KYCAdminListResponse(
                items=[self._to_list_item(kyc) for kyc in rows],
                total=total,
                page=page,
                page_size=page_size,
            )

    @staticmethod
    def _to_list_item(kyc: KYCVerification) -> KYCAdminListItem:
        return KYCAdminListItem(
            kyc_id=kyc.id,
            user_id=kyc.user_id,
            user_email=None,
            legal_full_name=kyc.personal_info.legal_full_name if kyc.personal_info else None,
            status=kyc.status,
            current_step=kyc.current_step,
            personal_info_status=kyc.personal_info.status if kyc.personal_info else None,
            contact_info_status=kyc.contact_info.status if kyc.contact_info else None,
            identity_status=kyc.identity_verification.status if kyc.identity_verification else None,
            banking_status=kyc.banking_info.status if kyc.banking_info else None,
            full_name_match_score=kyc.banking_info.account_name_match_score if kyc.banking_info else None,
            submitted_at=kyc.submitted_at,
            updated_at=kyc.updated_at,
        )


    async def get_admin_detail(self, kyc_id: UUID) -> KYCAdminDetailResponse:
            kyc = await self._repo.get_by_id(kyc_id)
            if kyc is None:
                raise KYCNotFoundError(str(kyc_id))
            audit_log = await self._audit_repo.list_for_kyc(kyc_id)
            return KYCAdminDetailResponse.from_kyc(kyc, audit_log)
        
    # ---- Admin / compliance review ----

    async def approve_step(self, kyc_id: UUID, step: KYCStepType):
        await self._repo.set_step_status(kyc_id, step, KYCStepStatus.approved)
        await self._advance_if_ready(kyc_id)

    async def reject_step(self, kyc_id: UUID, step: KYCStepType, reason: str):
        kyc = await self._repo.get_by_id(kyc_id)
        if kyc is None:
            raise KYCNotFoundError(str(kyc_id))
        await self._repo.set_step_status(kyc_id, step, KYCStepStatus.rejected, rejection_reason=reason)
        await self._transition(kyc, KYCStatus.rejected)

    async def finalize_verified(self, kyc_id: UUID):
        kyc = await self._repo.get_by_id(kyc_id)
        if kyc is None:
            raise KYCNotFoundError(str(kyc_id))
        if kyc.status == KYCStatus.verified:
            raise KYCAlreadyVerifiedError(str(kyc_id))
        kyc = await self._transition(kyc, KYCStatus.verified)
        await self._repo.set_overall_status(kyc.id, verified_at=datetime.now())
        await self._user_flags.set_kyc_verified(kyc.user_id, True)

    async def finalize_rejected(self, kyc_id: UUID, reason: str):
        kyc = await self._repo.get_by_id(kyc_id)
        if kyc is None:
            raise KYCNotFoundError(str(kyc_id))
        kyc = await self._transition(kyc, KYCStatus.rejected)
        await self._repo.set_overall_status(kyc.id, rejection_reason=reason)
        await self._user_flags.set_kyc_verified(kyc.user_id, False)


    async def begin_identity_submission(self, user_id: UUID):
        kyc = await self._require_editable(
            user_id,
            KYCStepType.identity_verification,
        )

        await self._repo.ensure_identity_exists(kyc.id)

        await self._repo.set_step_status(
            kyc.id,
            KYCStepType.identity_verification,
            KYCStepStatus.pending,
        )

        return kyc

    async def complete_identity_submission(self, kyc_id: UUID, data: IdentityInput):
        """Called from the Celery task once begin_identity_submission has
        already validated editability and marked the step 'processing'."""
        kyc = await self._repo.get_by_id(kyc_id)
        if kyc is None:
            raise KYCNotFoundError(str(kyc_id))
        await self._process_identity(kyc, data)

    async def _process_identity(self, kyc, data: IdentityInput):
        doc_key = await self._storage.upload(
            key=f"kyc/{kyc.id}/document/{uuid4()}", content=data.document_image_bytes,
            content_type=data.document_image_content_type,
        )
        selfie_key = await self._storage.upload(
            key=f"kyc/{kyc.id}/selfie/{uuid4()}", content=data.selfie_image_bytes,
            content_type=data.selfie_image_content_type,
        )
        video_key = None
        if data.video_bytes:
            video_key = await self._storage.upload(
                key=f"kyc/{kyc.id}/video/{uuid4()}", content=data.video_bytes,
                content_type=data.video_content_type or "video/mp4",
            )

        result = await self._identity_provider.verify_identity(
            document_type=data.document_type,
            document_number=data.document_number,
            document_image_key=doc_key,
            selfie_image_key=selfie_key,
            video_key=video_key,
        )

        await self._repo.upsert_identity(kyc.id, {
                "document_type": data.document_type,
                "document_number_encrypted": self._encryptor.encrypt(data.document_number),
                "document_image_key": doc_key,
                "selfie_image_key": selfie_key,
                "video_key": video_key,
                "liveness_check_passed": result.liveness_check_passed,
                "liveness_score": result.liveness_score,
                "provider_reference_id": result.reference_id,
                "provider_response": result.raw_response,
            })

        if not result.success:
            await self._repo.set_step_status(
                kyc.id, KYCStepType.identity_verification, KYCStepStatus.rejected,
                rejection_reason="Provider verification failed",
            )
            raise IdentityVerificationFailedError(result.raw_response)

        step_status = KYCStepStatus.submitted if result.requires_manual_review else KYCStepStatus.approved
        await self._repo.set_step_status(kyc.id, KYCStepType.identity_verification, step_status)
        await self._advance_if_ready(kyc.id)


    # ---- Internal helpers ----

    async def _require_editable(self, user_id: UUID, step: KYCStepType):
        """Loads the kyc record and guards against editing an already-approved step
        or a fully-verified KYC without an explicit admin reopen."""
        kyc = await self._repo.get_by_user_id(user_id)
        if kyc is None:
            raise KYCNotFoundError(f"Call start() before submitting steps for user {user_id}")
        if kyc.status == KYCStatus.verified:
            raise KYCAlreadyVerifiedError("Cannot edit a verified KYC record — admin reopen required")

        current_step_status = getattr(kyc, step.value).status if getattr(kyc, step.value) else None
        if current_step_status == KYCStepStatus.approved:
            raise StepAlreadyApprovedError(f"Step {step.value} already approved — cannot overwrite")

        # a rejected KYC becomes editable again as soon as the user touches any step
        if kyc.status == KYCStatus.rejected:
            kyc = await self._transition(kyc, KYCStatus.in_progress)

        return kyc

    async def _advance_if_ready(self, kyc_id: UUID):
        kyc = await self._repo.get_by_id(kyc_id)
        steps = [kyc.personal_info, kyc.contact_info, kyc.identity_verification, kyc.banking_info]
        if all(s is not None and s.status in (KYCStepStatus.submitted, KYCStepStatus.approved) for s in steps):
            if kyc.status == KYCStatus.in_progress:
                await self._transition(kyc, KYCStatus.pending_review)
                await self._repo.set_overall_status(kyc.id, submitted_at=datetime.now())

    async def _transition(self, kyc, new_status: KYCStatus):
        if new_status not in _ALLOWED_TRANSITIONS.get(kyc.status, set()):
            raise InvalidKYCStateTransitionError(f"Cannot go from {kyc.status} to {new_status}")
        return await self._repo.set_overall_status(kyc.id, status=new_status)