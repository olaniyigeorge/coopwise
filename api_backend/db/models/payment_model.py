from datetime import datetime
from enum import Enum
from uuid import uuid4
from decimal import Decimal

from sqlalchemy import Column, DateTime, Enum as ForeignKey, String, Numeric, JSON
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import relationship

from db.database import Base


class PaymentGateway(Enum):
    PAYSTACK = "paystack"
    FLUTTERWAVE = "flutterwave"
    MANUAL = "manual"
    OTHER = "other"


class PaymentStatus(Enum):
    INITIATED = "initiated"
    PENDING = "pending"
    SUCCESSFUL = "successful"
    FAILED = "failed"
    ABANDONED = "abandoned"
    REFUNDED = "refunded"


class Payment(Base):
    __tablename__ = "payments"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4, index=True)

    user_id = Column(PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    contribution_id = Column(PGUUID(as_uuid=True), ForeignKey("contributions.id"), nullable=True)

    amount = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(10), default="NGN", nullable=False)

    gateway = Column(Enum(PaymentGateway), nullable=False)
    status = Column(Enum(PaymentStatus), default=PaymentStatus.INITIATED, nullable=False)

    transaction_reference = Column(String(128), unique=True, nullable=True)
    provider_response = Column(JSON, nullable=True)  # raw response data for debugging or audits
    metadata = Column(JSON, nullable=True)  # extra info (IP address, device, etc.)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # user = relationship("User", back_populates="payments")
    # contribution = relationship("Contribution", back_populates="payment")

