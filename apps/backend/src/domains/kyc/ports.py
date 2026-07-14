from abc import ABC, abstractmethod
from typing import Optional
from uuid import UUID

from src.domains.kyc.models import (
    KYCVerification, KYCStepType, KYCStepStatus
)


class KYCRepositoryPort(ABC):
    @abstractmethod
    async def get_by_user_id(self, user_id: UUID) -> Optional[KYCVerification]: ...

    @abstractmethod
    async def get_by_id(self, kyc_id: UUID) -> Optional[KYCVerification]: ...

    @abstractmethod
    async def create(self, user_id: UUID) -> KYCVerification: ...

    @abstractmethod
    async def upsert_personal_info(self, kyc_id: UUID, data: dict) -> None: ...

    @abstractmethod
    async def upsert_contact_info(self, kyc_id: UUID, data: dict) -> None: ...

    @abstractmethod
    async def upsert_identity(self, kyc_id: UUID, data: dict) -> None: ...

    @abstractmethod
    async def upsert_banking_info(self, kyc_id: UUID, data: dict) -> None: ...

    @abstractmethod
    async def set_step_status(
        self, kyc_id: UUID, step: KYCStepType, status: KYCStepStatus,
        rejection_reason: Optional[str] = None
    ) -> None: ...

    @abstractmethod
    async def set_overall_status(self, kyc_id: UUID, **fields) -> KYCVerification: ...

    @abstractmethod
    async def find_by_provider_reference(self, reference_id: str) -> Optional[KYCVerification]: ...


class FieldEncryptorPort(ABC):
    @abstractmethod
    def encrypt(self, value: str) -> str: ...

    @abstractmethod
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


class IdentityVerificationProviderPort(ABC):
    @abstractmethod
    async def verify_identity(
        self, document_type: str, document_number: str,
        document_image_key: str, selfie_image_key: str,
        video_key: Optional[str] = None,
    ) -> IdentityVerificationResult: ...


class BankAccountVerificationResult:
    def __init__(self, success: bool, resolved_account_name: Optional[str], raw_response: str):
        self.success = success
        self.resolved_account_name = resolved_account_name
        self.raw_response = raw_response


class BankVerificationProviderPort(ABC):
    @abstractmethod
    async def resolve_account_name(self, bank_code: str, account_number: str) -> BankAccountVerificationResult: ...


class ObjectStoragePort(ABC):
    @abstractmethod
    async def upload(self, key: str, content: bytes, content_type: str) -> str: ...


class UserKYCFlagPort(ABC):
    """Narrow port so kyc domain never imports users domain internals directly."""

    @abstractmethod
    async def set_kyc_verified(self, user_id: UUID, verified: bool) -> None: ...

class KYCNotifierPort(ABC):
    """
    Narrow notification boundary for the kyc domain. KYC never imports
    notifications.service or builds NotificationCreate payloads directly.
    """

    async def notify_kyc_user_step_rejected(self, verification: KYCVerification, status=KYCStepType) -> None: ...