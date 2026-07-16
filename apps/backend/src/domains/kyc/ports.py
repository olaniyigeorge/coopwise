from typing import Optional, Protocol
from uuid import UUID

from src.domains.kyc.models import (
    KYCVerification, KYCStepType, KYCStepStatus
)
from src.domains.kyc.audit_models import KYCAuditLog

class KYCAuditRepositoryPort(Protocol):
    async def create(
        self, *, kyc_id, admin_id, action: str, step: str | None,
        reason: str | None, metadata: dict, ip_address: str | None, user_agent: str | None,
    ): ...

class KYCRepositoryPort(Protocol):
    async def get_by_user_id(self, user_id: UUID) -> Optional[KYCVerification]: ...

    async def get_by_id(self, kyc_id: UUID) -> Optional[KYCVerification]: ...

    async def create(self, user_id: UUID) -> KYCVerification: ...

    async def upsert_personal_info(self, kyc_id: UUID, data: dict) -> None: ...

    async def upsert_contact_info(self, kyc_id: UUID, data: dict) -> None: ...

    async def upsert_identity(self, kyc_id: UUID, data: dict) -> None: ...

    async def upsert_banking_info(self, kyc_id: UUID, data: dict) -> None: ...

    async def ensure_identity_exists(self, kyc_id: UUID) -> None: ...

    async def set_step_status(
        self, kyc_id: UUID, step: KYCStepType, status: KYCStepStatus,
        rejection_reason: Optional[str] = None
    ) -> None: ...

    async def set_overall_status(self, kyc_id: UUID, **fields) -> KYCVerification: ...

    async def find_by_provider_reference(self, reference_id: str) -> Optional[KYCVerification]: ...


class FieldEncryptorPort(Protocol):
    def encrypt(self, value: str) -> str: ...

    def decrypt(self, token: str) -> str: ...


class IdentityVerificationResult:
    def __init__(
        self, success: bool, reference_id: str, raw_response: str,
        requires_manual_review: bool = False,
        liveness_passed: Optional[bool] = None, liveness_score: Optional[float] = None,
    ):
        self.success = success
        self.reference_id = reference_id
        self.raw_response = raw_response
        self.requires_manual_review = requires_manual_review
        self.liveness_passed = liveness_passed
        self.liveness_score = liveness_score


class IdentityVerificationProviderPort(Protocol):
    async def verify_identity(
        self, document_type: str, document_number: str,
        document_image_key: str, selfie_image_key: str,
        video_key: Optional[str] = None,
    ) -> IdentityVerificationResult: ...


from typing import Optional, Any


class BankAccountVerificationResult:
    def __init__(
        self,
        success: bool,
        resolved_account_name: Optional[str],
        raw_response: Any,
    ):
        self.success = success
        self.resolved_account_name = resolved_account_name
        self.raw_response = raw_response

class BankVerificationProviderPort(Protocol):
    async def resolve_account_name(self, bank_code: str, account_number: str) -> BankAccountVerificationResult: ...


class ObjectStoragePort(Protocol):
    async def upload(self, key: str, content: bytes, content_type: str) -> str: ...


class UserKYCFlagPort(Protocol):
    """Narrow port so kyc domain never imports users domain internals directly."""

    async def set_kyc_verified(self, user_id: UUID, verified: bool) -> None: ...

class KYCNotifierPort(Protocol):
    """
    Narrow notification boundary for the kyc domain. KYC never imports
    notifications.service or builds NotificationCreate payloads directly.
    """

    async def notify_kyc_user_step_rejected(self, verification: KYCVerification, status=KYCStepType) -> None: ...