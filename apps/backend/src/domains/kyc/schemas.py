from dataclasses import dataclass
from datetime import date, datetime
from typing import Optional, Any
from uuid import UUID

from pydantic import BaseModel, Field, field_validator, ConfigDict

from src.domains.kyc.models import (
    KYCStatus, KYCStepType, KYCStepStatus,
    KYCIdentityVerification,
    KYCIdDocumentType, EmploymentStatus, KYCVerification, SourceOfFunds,
)



# ---- Domain-level input DTOs (router maps its pydantic schemas to these — keeps service FastAPI-agnostic) ----
@dataclass
class PersonalInfoInput:
    legal_full_name: str
    date_of_birth: date
    nationality: str
    employment_status: str
    source_of_funds: str
    income_currency: str
    gender: Optional[str] = None
    occupation_or_business_type: Optional[str] = None
    monthly_income_range: Optional[str] = None


@dataclass
class ContactInfoInput:
    residential_address: str
    city: str
    state: str
    postal_code: str
    country: str
    next_of_kin_name: Optional[str] = None
    next_of_kin_phone: Optional[str] = None


@dataclass
class IdentityInput:
    document_type: str
    document_number: str
    document_image_bytes: bytes
    document_image_content_type: str
    selfie_image_bytes: bytes
    selfie_image_content_type: str
    video_bytes: Optional[bytes] = None
    video_content_type: Optional[str] = None


@dataclass
class BankingInfoInput:
    bank_name: str
    bank_code: str
    account_number: str
    account_name: str



# ---------- Requests ----------

class PersonalInfoRequest(BaseModel):
    legal_full_name: str = Field(..., min_length=2, max_length=255)
    date_of_birth: date
    gender: Optional[str] = None
    nationality: str = Field(..., min_length=2, max_length=100)
    employment_status: EmploymentStatus
    occupation_or_business_type: Optional[str] = None
    source_of_funds: SourceOfFunds
    monthly_income_range: Optional[str] = None
    income_currency: str = Field(..., min_length=3, max_length=3)

    @field_validator("date_of_birth")
    @classmethod
    def must_be_adult(cls, v: date) -> date:
        age = (date.today() - v).days // 365
        if age < 18:
            raise ValueError("Must be at least 18 years old")
        return v

    @field_validator("income_currency")
    @classmethod
    def uppercase_currency(cls, v: str) -> str:
        return v.upper()


class ContactInfoRequest(BaseModel):
    residential_address: str = Field(..., min_length=5)
    city: str
    state: str
    postal_code: str
    country: str
    next_of_kin_name: Optional[str] = None
    next_of_kin_phone: Optional[str] = None


class BankingInfoRequest(BaseModel):
    bank_name: str
    bank_code: str
    account_number: str = Field(..., min_length=10, max_length=10)
    account_name: str

    @field_validator("account_number")
    @classmethod
    def digits_only(cls, v: str) -> str:
        if not v.isdigit():
            raise ValueError("account_number must be numeric")
        return v


# IdentityInfo isn't a JSON body — it's multipart with files.
# Fields are declared directly on the router endpoint via Form(...)/File(...).


class RejectStepRequest(BaseModel):
    reason: str = Field(..., min_length=3)


class FinalizeRejectRequest(BaseModel):
    reason: str = Field(..., min_length=3)


# ---------- Responses ----------

class StepSummary(BaseModel):
    step: KYCStepType
    status: KYCStepStatus
    submitted_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class KYCSummaryResponse(BaseModel):
    """Dashboard progress overview."""
    kyc_id: UUID
    overall_status: KYCStatus
    current_step: Optional[KYCStepType] = None

    total_steps: int = 4
    submitted_count: int
    approved_count: int
    rejected_count: int

    steps: list[StepSummary]

    submitted_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None
    verified_at: Optional[datetime] = None


class PersonalInfoDetail(BaseModel):
    legal_full_name: str
    date_of_birth: date
    gender: Optional[str]
    nationality: str
    employment_status: EmploymentStatus
    occupation_or_business_type: Optional[str]
    source_of_funds: SourceOfFunds
    monthly_income_range: Optional[str]
    income_currency: str
    status: KYCStepStatus
    rejection_reason: Optional[str]

    model_config = ConfigDict(from_attributes=True)


class ContactInfoDetail(BaseModel):
    residential_address: str
    city: str
    state: str
    postal_code: str
    country: str
    next_of_kin_name: Optional[str]
    next_of_kin_phone: Optional[str]
    status: KYCStepStatus
    rejection_reason: Optional[str]

    model_config = ConfigDict(from_attributes=True)


class IdentityDetail(BaseModel):
    document_type: KYCIdDocumentType
    liveness_check_passed: Optional[bool]
    status: KYCStepStatus
    rejection_reason: Optional[str]
    # document_number, image/video keys deliberately omitted — sensitive/internal

    model_config = ConfigDict(from_attributes=True)


class BankingInfoDetail(BaseModel):
    bank_name: str
    bank_code: str
    account_number_last4: str
    account_name: str
    provider_verified: bool
    status: KYCStepStatus
    rejection_reason: Optional[str]
    # account_number_encrypted deliberately omitted

    model_config = ConfigDict(from_attributes=True)


class KYCStatusResponse(BaseModel):
    """Full detail view — everything except encrypted/raw provider payloads."""
    id: UUID
    user_id: UUID
    status: KYCStatus
    current_step: Optional[KYCStepType]

    personal_info: Optional[PersonalInfoDetail] = None
    contact_info: Optional[ContactInfoDetail] = None
    identity: Optional[IdentityDetail] = None
    banking_info: Optional[BankingInfoDetail] = None

    submitted_at: Optional[datetime]
    reviewed_at: Optional[datetime]
    verified_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)



class StartKYCResponse(BaseModel):
    id: UUID
    user_id: UUID
    status: KYCStatus
    current_step: Optional[KYCStepType]

    model_config = ConfigDict(from_attributes=True)


class BankAccountVerificationResult(BaseModel):
    success: bool
    resolved_account_name: Optional[str] = None
    raw_response: Any

    model_config = ConfigDict(from_attributes=True)


class IdentityVerificationResult(BaseModel):
    success: bool
    reference_id: str
    raw_response: Any
    requires_manual_review: bool = False
    liveness_score: Optional[float] = None,
    liveness_check_passed: Optional[bool] =  None


    model_config = ConfigDict(from_attributes=True)



















class KYCAdminPersonalInfo(BaseModel):
    legal_full_name: str
    date_of_birth: date
    gender: str | None
    nationality: str
    employment_status: EmploymentStatus
    occupation_or_business_type: str | None
    source_of_funds: SourceOfFunds
    monthly_income_range: str | None
    income_currency: str
    status: KYCStepStatus
    submitted_at: datetime | None
    rejection_reason: str | None

    model_config = ConfigDict(from_attributes=True)


class KYCAdminContactInfo(BaseModel):
    residential_address: str
    city: str
    state: str
    postal_code: str
    country: str
    next_of_kin_name: str | None
    next_of_kin_phone: str | None
    status: KYCStepStatus
    submitted_at: datetime | None
    rejection_reason: str | None

    model_config = ConfigDict(from_attributes=True)


class KYCAdminBankingInfo(BaseModel):
    bank_name: str
    bank_code: str
    account_number_last4: str
    account_name: str
    provider_verified: bool
    account_name_match_score: float | None
    status: KYCStepStatus
    submitted_at: datetime | None
    rejection_reason: str | None

    model_config = ConfigDict(from_attributes=True)






class KYCAdminListItem(BaseModel):
    kyc_id: UUID
    user_id: UUID
    user_email: str | None
    legal_full_name: str | None
    status: KYCStatus
    current_step: KYCStepType | None
    personal_info_status: KYCStepStatus | None
    contact_info_status: KYCStepStatus | None
    identity_status: KYCStepStatus | None
    banking_status: KYCStepStatus | None
    full_name_match_score: float | None
    submitted_at: datetime | None
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class KYCAdminListResponse(BaseModel):
    items: list[KYCAdminListItem]
    total: int
    page: int
    page_size: int


class KYCAuditLogEntry(BaseModel):
    id: UUID
    admin_id: UUID
    action: str
    step: str | None
    reason: str | None
    metadata_: dict = Field(alias="metadata")
    created_at: datetime

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class KYCAdminIdentityDetail(BaseModel):
    status: KYCStepStatus
    document_type: KYCIdDocumentType
    document_image_url: str | None
    selfie_image_url: str | None
    video_url: str | None
    liveness_check_passed: bool | None
    liveness_score: float | None
    extracted_document_name: str | None
    legal_full_name: str | None
    full_name_match_score: float | None
    provider: str | None
    provider_reference_id: str | None
    submitted_at: datetime | None
    rejection_reason: str | None

    @classmethod
    def from_kyc(cls, kyc: "KYCVerification") -> Optional["KYCAdminIdentityDetail"]:
        idv: KYCIdentityVerification = kyc.identity_verification
        if idv is None:
            return None
        return cls(
            status=idv.status,
            document_type=idv.document_type,
            document_image_url=idv.document_image_key,   # already a full secure_url, not a raw key
            selfie_image_url=idv.selfie_image_key,
            video_url=idv.video_key,
            liveness_check_passed=idv.liveness_check_passed,
            liveness_score=idv.liveness_score,
            extracted_document_name=getattr(idv, "extracted_document_name", None),
            legal_full_name=kyc.personal_info.legal_full_name if kyc.personal_info else None,
            full_name_match_score=kyc.banking_info.account_name_match_score if kyc.banking_info else None,
            provider=idv.provider,
            provider_reference_id=idv.provider_reference_id,
            submitted_at=idv.submitted_at,
            rejection_reason=idv.rejection_reason,
        )
    

class KYCAdminDetailResponse(BaseModel):
    kyc_id: UUID
    user_id: UUID
    user_email: str | None
    status: KYCStatus
    personal_info: KYCAdminPersonalInfo | None
    contact_info: KYCAdminContactInfo | None
    identity_verification: KYCAdminIdentityDetail | None
    banking_info: KYCAdminBankingInfo | None
    audit_log: list[KYCAuditLogEntry]

    @classmethod
    def from_kyc(cls, kyc: "KYCVerification", audit_log: list, user_email: str | None = None) -> "KYCAdminDetailResponse":
        return cls(
            kyc_id=kyc.id,
            user_id=kyc.user_id,
            user_email=user_email,
            status=kyc.status,
            personal_info=KYCAdminPersonalInfo.model_validate(kyc.personal_info) if kyc.personal_info else None,
            contact_info=KYCAdminContactInfo.model_validate(kyc.contact_info) if kyc.contact_info else None,
            identity_verification=KYCAdminIdentityDetail.from_kyc(kyc),
            banking_info=KYCAdminBankingInfo.model_validate(kyc.banking_info) if kyc.banking_info else None,
            audit_log=[KYCAuditLogEntry.model_validate(a) for a in audit_log],
        )
