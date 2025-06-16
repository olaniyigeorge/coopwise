from datetime import datetime
from uuid import uuid4
from sqlalchemy import Column, Numeric, String, DateTime, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import relationship
from db.database import Base
import enum


class LocalCurrency(enum.Enum):
    NGN = "NGN"
    GHS = "GHS"
    KES = "KES"
    # …add more as needed


class Wallet(Base):
    __tablename__ = "wallets"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)

    # Balance denominated in stable coin (e.g. USDC). All internal debits/credits happen here.
    stable_coin_balance = Column(Numeric(precision=20, scale=8), default=0, nullable=False)

    # The user’s default “display” fiat currency. Converts on-the-fly via GraphQL.
    local_currency = Column(Enum(LocalCurrency), default=LocalCurrency.NGN, nullable=False)

    created_at = Column(DateTime, default=datetime.now, nullable=False)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.utcnow, nullable=False)

    # Relationship
    user = relationship("User", back_populates="wallet", lazy="joined")
    ledger_entries = relationship("WalletLedger", back_populates="wallet", cascade="all, delete-orphan", lazy="selectin")














# ----------------- wallet_ledger -----------



class LedgerType(enum.Enum):
    DEPOSIT = "deposit"
    WITHDRAWAL = "withdrawal"
    CONTRIBUTION = "contribution"  # when user spends from wallet to pay a coop contribution
    REFUND = "refund"              # e.g. reversed contribution

class LedgerStatus(enum.Enum):
    INITIATED = "initiated"  
    PENDING = "pending"      
    SETTLED = "settled"      
    FAILED = "failed"        

class WalletLedger(Base):
    __tablename__ = "wallet_ledger"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    wallet_id = Column(PGUUID(as_uuid=True), ForeignKey("wallets.id"), nullable=False, index=True)
    type = Column(Enum(LedgerType), nullable=False)
    # Amount in stable coin (e.g. USDC) that changed
    stable_amount = Column(Numeric(precision=20, scale=8), nullable=False)
    # Local fiat amount before conversion
    local_amount = Column(Numeric(precision=20, scale=2), nullable=False)
    # Local currency used (matches Wallet.local_currency)
    local_currency = Column(Enum(LocalCurrency), nullable=False)
    # Exchange rate applied: local_currency → stable coin
    exchange_rate = Column(Numeric(precision=20, scale=8), nullable=False)
    # status = Column(Enum(LedgerStatus), nullable=False, default=LedgerStatus.INITIATED)
    status = Column(Enum(LedgerStatus), default=LedgerStatus.INITIATED, nullable=False)
    

    created_at = Column(DateTime, default=datetime.now, nullable=False)
    wallet = relationship("Wallet", back_populates="ledger_entries", lazy="joined")




