# User initiates payment
#         ↓
# domains/payments/service.py
#   - creates WalletLedger(status=initiated)
#   - dispatches to the right gateway handler
#         ↓
#     ┌───────────────────────────────┐
#     │ web2 rail                     │ web3 rail
#     │ infra/payments/               │ infra/blockchain/
#     │   paystack_service.py         │   contract_service.py
#     │   flutterwave_service.py      │   chain.py
#     │   cashramp_service.py         │
#     └───────────────────────────────┘
#         ↓                                   ↓
#   webhook callback               on-chain event / confirmation
#         ↓                                   ↓
# domains/payments/service.py
#   - updates WalletLedger(status=settled, provider_reference=... OR tx_hash=...)
#   - updates Wallet balance
#   - emits notification event

import enum
from datetime import datetime
from uuid import uuid4

from sqlalchemy import (
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import relationship

from src.infra.db.database import Base


class PayoutStatus(enum.Enum):
    pending = "pending"
    processing = "processing"
    completed = "completed"
    failed = "failed"


class PayoutRecord(Base):
    """
    A single fiat payout to a member, disbursed via a payment provider
    (Paystack transfer). The source of truth for payout history and
    rotation-order tracking — supersedes inferring history from
    completed Contribution rows.
    """

    __tablename__ = "payout_records"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4, index=True)

    group_id = Column(
        PGUUID(as_uuid=True), ForeignKey("coop_cooperatives.id"), nullable=False
    )
    user_id = Column(PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    round_number = Column(Integer, nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(10), default="NGN", nullable=False)

    status = Column(Enum(PayoutStatus), default=PayoutStatus.pending, nullable=False)
    provider = Column(String(32), default="paystack", nullable=False)
    recipient_code = Column(String, nullable=True)
    provider_reference = Column(String, nullable=True, index=True)
    failure_reason = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.now, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.now, onupdate=datetime.now, nullable=False
    )
    completed_at = Column(DateTime, nullable=True)

    group = relationship("CoopCooperative", back_populates=None)
    user = relationship("User", back_populates=None)
