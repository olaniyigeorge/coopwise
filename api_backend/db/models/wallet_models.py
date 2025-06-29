from datetime import datetime
from uuid import uuid4
from sqlalchemy import Boolean, Column, Numeric, String, DateTime, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import relationship
from db.database import Base
import enum


class LocalCurrency(enum.Enum):
    """
        Recognised local currencies
    """
    #TODO Make list dynamic
    NGN = "NGN"
    GHS = "GHS"
    KES = "KES"



class Wallet(Base):
    __tablename__ = "wallets"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)

    # Balance denominated in stable coin (e.g. USDC). All internal debits/credits happen here.
    stable_coin_balance = Column(Numeric(precision=20, scale=8), default=0, nullable=False)
    # The user’s default “display” fiat currency. Converts on-the-fly per payment gateway used on trx.
    local_currency = Column(Enum(LocalCurrency), default=LocalCurrency.NGN, nullable=False)

    

    created_at = Column(DateTime, default=datetime.now, nullable=False)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, nullable=False)

    # Relationship
    user = relationship("User", back_populates="wallet", lazy="joined")
    ledger_entries = relationship("WalletLedger", back_populates="wallet", cascade="all, delete-orphan", lazy="selectin")














# ----------------- wallet_ledger(tnx record) -----------

class PaymentGateway(enum.Enum):
    paystack = "paystack"
    flutterwave = "flutterwave"
    cashramp = "cashramp"
    on_chain_cashramp = "on_chain_cashramp"
    on_chain_solana = "on_chain_solana"
    cash = "cash"


class LedgerType(enum.Enum):
    deposit = "deposit" # + wallet
    withdrawal = "withdrawal" # - wallet
    contribution = "contribution"  # - wallet
    refund = "refund"    # + wallet e.g. reversed contribution

class LedgerStatus(enum.Enum):
    initiated = "initiated"  
    pending = "pending"      
    settled = "settled"      
    failed = "failed"        

class WalletLedger(Base): # TNX RECORD
    __tablename__ = "wallet_ledger"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    wallet_id = Column(PGUUID(as_uuid=True), ForeignKey("wallets.id"), nullable=False, index=True)
    contribution_id = Column(PGUUID(as_uuid=True), ForeignKey("contributions.id"), nullable=True)
    
    note = Column(String, nullable=True)
    gateway = Column(Enum(PaymentGateway), default=PaymentGateway.cashramp, nullable=False) # Gateway default support: cashramp(off_chain), on_chain_cashramp, on_chain_solana  

    type = Column(Enum(LedgerType), nullable=False)
    stable_amount = Column(Numeric(precision=20, scale=8), nullable=False) # Amount in stable coin (e.g. USDC) 
    local_amount = Column(Numeric(precision=20, scale=2), nullable=False)   # Local fiat amount before conversion
    local_currency = Column(Enum(LocalCurrency), nullable=False)
    exchange_rate = Column(Numeric(precision=20, scale=8), nullable=False) # Exchange rate applied: local_currency → stable coin... Set default to local_amount/stable_amount
    status = Column(Enum(LedgerStatus), default=LedgerStatus.initiated, nullable=False)

    created_at = Column(DateTime, default=datetime.now, nullable=False)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, nullable=False)
    
    wallet = relationship(
        "Wallet", 
        back_populates="ledger_entries", 
        lazy="joined"
    )
    contribution = relationship(
        "Contribution", 
        back_populates="wallet_ledger", 
        lazy="joined", 
        uselist=False
    )



# ----------------- FIAT BANK ACCOUNTS -----------
class BankAccount(Base):
    __tablename__ = "bank_accounts"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    account_number = Column(String, nullable=False, index=True)
    bank_name = Column(String, nullable=False)
    account_name = Column(String, nullable=False)
    is_primary = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.now, nullable=False)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, nullable=False)

    user = relationship("User", back_populates="bank_accounts")
