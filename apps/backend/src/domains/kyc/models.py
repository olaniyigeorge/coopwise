import enum
from uuid import uuid4
from datetime import datetime
import uuid
from sqlalchemy import JSON, Column, String, Boolean, DateTime, Enum, ForeignKey, Text, Date, Float
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.infra.db.database import Base


class KYCStatus(enum.Enum):
    not_started = "not_started"
    in_progress = "in_progress"
    pending_review = "pending_review"
    verified = "verified"
    rejected = "rejected"
    expired = "expired"


class KYCStepType(enum.Enum):
    personal_info = "personal_info"
    contact_info = "contact_info"
    identity_verification = "identity_verification"
    banking_info = "banking_info"


class KYCStepStatus(enum.Enum):
    pending = "pending"
    submitted = "submitted"
    approved = "approved"
    rejected = "rejected"


class KYCIdDocumentType(enum.Enum):
    nin = "nin"
    bvn = "bvn"
    passport = "passport"
    drivers_license = "drivers_licence"
    voters_card = "voters_card"


class EmploymentStatus(enum.Enum):
    employed = "employed"
    self_employed = "self_employed"
    business_owner = "business_owner"
    unemployed = "unemployed"
    student = "student"
    retired = "retired"


class SourceOfFunds(enum.Enum):
    salary = "salary"
    business_income = "business_income"
    investments = "investments"
    gifts = "gifts"
    inheritance = "inheritance"
    savings = "savings"
    other = "other"


class KYCVerification(Base):
    __tablename__ = "kyc_verifications"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=lambda: uuid4(), index=True)
    user_id = Column(PGUUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False, index=True)

    status = Column(Enum(KYCStatus), default=KYCStatus.not_started, nullable=False)
    #TODO: Drop the current_step field as its derivable
    current_step = Column(Enum(KYCStepType), nullable=True)

    submitted_at = Column(DateTime, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    verified_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.now, nullable=False)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, nullable=False)

    personal_info = relationship("KYCPersonalInfo", back_populates="kyc", uselist=False, lazy="selectin")
    contact_info = relationship("KYCContactInfo", back_populates="kyc", uselist=False, lazy="selectin")
    identity = relationship("KYCIdentityVerification", back_populates="kyc", uselist=False, lazy="selectin")
    banking_info = relationship("KYCBankingInfo", back_populates="kyc", uselist=False, lazy="selectin")


# ---- Step 1: Personal & financial profile ----
class KYCPersonalInfo(Base):
    __tablename__ = "kyc_personal_info"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=lambda: uuid4())
    kyc_verification_id = Column(PGUUID(as_uuid=True), ForeignKey("kyc_verifications.id"), unique=True, nullable=False)

    legal_full_name = Column(String, nullable=False)   # must match ID document exactly
    date_of_birth = Column(Date, nullable=False)
    gender = Column(String, nullable=True)
    nationality = Column(String, nullable=False)

    # Employment / financial profile
    employment_status = Column(Enum(EmploymentStatus), nullable=False)
    occupation_or_business_type = Column(String, nullable=True)  # e.g. "Software Engineer", "Trader - Textiles"
    source_of_funds = Column(Enum(SourceOfFunds), nullable=False)
    monthly_income_range = Column(String, nullable=True)  # reuse existing IncomeRange enum from users.models
    income_currency = Column(String(3), nullable=False)   # ISO 4217 code, e.g. NGN, KES, GHS — validated in schema, not DB enum, so new markets don't need a migration

    status = Column(Enum(KYCStepStatus), default=KYCStepStatus.pending, nullable=False)
    submitted_at = Column(DateTime, nullable=True)

    rejection_reason = Column(Text, nullable=True)

    kyc = relationship("KYCVerification", back_populates="personal_info")


# ---- Step 2: Contact & address ----
class KYCContactInfo(Base):
    __tablename__ = "kyc_contact_info"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=lambda: uuid4())
    kyc_verification_id = Column(PGUUID(as_uuid=True), ForeignKey("kyc_verifications.id"), unique=True, nullable=False)

    residential_address = Column(String, nullable=False)
    city = Column(String, nullable=False)
    state = Column(String, nullable=False)
    postal_code = Column(String, nullable=False)
    country = Column(String, nullable=False)
    next_of_kin_name = Column(String, nullable=True)
    next_of_kin_phone = Column(String, nullable=True)

    status = Column(Enum(KYCStepStatus), default=KYCStepStatus.pending, nullable=False)
    submitted_at = Column(DateTime, nullable=True)

    rejection_reason = Column(Text, nullable=True)

    kyc = relationship("KYCVerification", back_populates="contact_info")


# ---- Step 3: Identity + liveness/video verification ----
class KYCIdentityVerification(Base):
    __tablename__ = "kyc_identity_verifications"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=lambda: uuid4())
    kyc_verification_id = Column(PGUUID(as_uuid=True), ForeignKey("kyc_verifications.id"), unique=True, nullable=False)

    document_type = Column(Enum(KYCIdDocumentType), nullable=False)
    document_number_encrypted = Column(String, nullable=False)   # via FieldEncryptor, not bcrypt
    document_image_key = Column(String, nullable=True)
    selfie_image_key = Column(String, nullable=True)

    # Video / liveness
    video_key = Column(String, nullable=True)            # object-storage key, never store video blob in DB
    liveness_check_passed = Column(Boolean, nullable=True)
    liveness_score = Column(Float, nullable=True)

    provider = Column(String, nullable=True)
    provider_reference_id = Column(String, nullable=True)
    # TODO: COnsider encypting in case it contains sensitive data 
    provider_response = Column(Text, nullable=True)

    status = Column(Enum(KYCStepStatus), default=KYCStepStatus.pending, nullable=False)
    submitted_at = Column(DateTime, nullable=True)

    rejection_reason = Column(Text, nullable=True)

    kyc = relationship("KYCVerification", back_populates="identity")


class KYCIdentitySubmissionHistory(Base):
    __tablename__ = "kyc_identity_submission_history"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    kyc_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("kyc_verifications.id"), index=True)
    document_image_key: Mapped[str]
    selfie_image_key: Mapped[str]
    video_key: Mapped[str | None]
    provider_reference_id: Mapped[str | None]
    outcome: Mapped[str]  # "approved" | "rejected" | "manual_review"
    rejection_reason: Mapped[str | None]
    submitted_at: Mapped[datetime] = mapped_column(default=datetime.now)


# ---- Step 4: Banking ----
class KYCBankingInfo(Base):
    __tablename__ = "kyc_banking_info"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=lambda: uuid4())
    kyc_verification_id = Column(PGUUID(as_uuid=True), ForeignKey("kyc_verifications.id"), unique=True, nullable=False)

    bank_name = Column(String, nullable=False)
    bank_code = Column(String, nullable=False)
    account_number_encrypted = Column(String, nullable=False)   # via FieldEncryptor
    account_number_last4 = Column(String(4), nullable=False)
    account_name = Column(String, nullable=False)
    provider_verified = Column(Boolean, default=False, nullable=False)

    status = Column(Enum(KYCStepStatus), default=KYCStepStatus.pending, nullable=False)
    submitted_at = Column(DateTime, nullable=True)

    rejection_reason = Column(Text, nullable=True)

    kyc = relationship("KYCVerification", back_populates="banking_info")