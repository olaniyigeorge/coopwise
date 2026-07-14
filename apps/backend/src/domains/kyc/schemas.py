from datetime import date, datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator, ConfigDict

from src.domains.kyc.models import (
    KYCStatus, KYCStepType, KYCStepStatus,
    KYCIdDocumentType, EmploymentStatus, SourceOfFunds,
)


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