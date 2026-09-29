from datetime import datetime
from uuid import uuid4
from sqlalchemy import (
    BigInteger,
    Boolean,
    Column,
    Numeric,
    String,
    DateTime,
    ForeignKey,
    Enum,
    JSON,
)
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import relationship
from src.infra.db.database import Base
from src.shared.money import from_kobo, from_micro
import enum


class LocalCurrency(enum.Enum):
    """
    Recognised local currencies
    """

    # TODO Make list dynamic
    NGN = "NGN"
    GHS = "GHS"
    KES = "KES"


class Wallet(Base):
    __tablename__ = "wallets"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(
        PGUUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
        index=True,
        unique=True,
    )

    # Balance denominated in stable coin (e.g. USDC), stored as WHOLE micro-units
    # (1 stable coin = 1_000_000) so arithmetic and comparisons are exact.
    # All internal debits/credits happen here. Read it as a Decimal through the
    # `stable_coin_balance` property; write with src.shared.money.to_micro().
    stable_coin_balance_micro = Column(BigInteger, default=0, nullable=False)
    # Funds set aside for an in-flight contribution (locked_for_contribution ->
    # finalize_contribution_debit, or released back on failure). Same unit.
    stable_coin_locked_micro = Column(BigInteger, default=0, nullable=False)
    # The user’s default “display” fiat currency. Converts on-the-fly per payment gateway used on trx.
    local_currency = Column(
        Enum(LocalCurrency), default=LocalCurrency.NGN, nullable=False
    )

    created_at = Column(DateTime, default=datetime.now, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.now, onupdate=datetime.now, nullable=False
    )

    # Relationship
    user = relationship("User", back_populates="wallet", lazy="joined")
    ledger_entries = relationship(
        "WalletLedger",
        back_populates="wallet",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    @property
    def stable_coin_balance(self):
        """Available balance as an exact Decimal (6 places). Read-only."""
        return from_micro(self.stable_coin_balance_micro)

    @property
    def stable_coin_locked(self):
        return from_micro(self.stable_coin_locked_micro)


# ----------------- wallet_ledger(tnx record) -----------


class PaymentGateway(enum.Enum):
    paystack = "paystack"
    flutterwave = "flutterwave"
    cashramp = "cashramp"
    on_chain_cashramp = "on_chain_cashramp"
    on_chain_solana = "on_chain_solana"
    coopwise_network = "coopwise_network"
    cash = "cash"


class LedgerType(enum.Enum):
    deposit = "deposit"  # + wallet
    withdrawal = "withdrawal"  # - wallet
    contribution = "contribution"  # - wallet
    refund = "refund"  # + wallet e.g. reversed contribution
    # Internal balance <-> locked transfers backing the contribution
    # lock/finalize/release protocol (WalletService.lock_for_contribution
    # et al.) — these were referenced by the service before existing here,
    # an AttributeError on every lock/finalize/release call.
    debit_locked = "debit_locked"  # balance -> locked, funds set aside
    debit_finalize = "debit_finalize"  # locked -> gone, moved to group pool
    debit_revert = "debit_revert"  # locked -> balance, released back


class LedgerStatus(enum.Enum):
    initiated = "initiated"
    pending = "pending"
    settled = "settled"
    failed = "failed"


class StableCurrency(enum.Enum):
    usdc = "usdc"
    usdt = "usdt"
    cusd = "cusd"
    dai = "dai"


class WalletLedger(Base):  # TNX RECORD
    __tablename__ = "wallet_ledger"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    reference = Column(String(128), unique=True, index=True, nullable=False)

    wallet_id = Column(
        PGUUID(as_uuid=True), ForeignKey("wallets.id"), nullable=False, index=True
    )
    contribution_id = Column(
        PGUUID(as_uuid=True), ForeignKey("contributions.id"), nullable=True
    )

    type = Column(Enum(LedgerType), nullable=False)
    # Signed whole micro-units of the stable coin (debits are negative).
    stable_amount_micro = Column(BigInteger, nullable=False)
    stable_currency = Column(
        Enum(StableCurrency), nullable=False, default=StableCurrency.usdc
    )
    # Whole minor units of the local currency (kobo for NGN).
    local_amount_minor = Column(BigInteger, nullable=False)
    local_currency = Column(Enum(LocalCurrency), nullable=False)
    exchange_rate = Column(
        Numeric(precision=20, scale=8), nullable=False
    )  # Exchange rate applied: local_currency → stable coin... Set default to local_amount/stable_amount

    gateway = Column(
        Enum(PaymentGateway), default=PaymentGateway.paystack, nullable=False
    )  # TODO move default gateway to on_chain_solana
    status = Column(Enum(LedgerStatus), default=LedgerStatus.initiated, nullable=False)
    note = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.now, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.now, onupdate=datetime.now, nullable=False
    )

    wallet = relationship("Wallet", back_populates="ledger_entries", lazy="joined")
    contribution = relationship(
        "Contribution",
        back_populates="wallet_ledger_entries",
        lazy="joined",
        uselist=False,
    )

    @property
    def stable_amount(self):
        return from_micro(self.stable_amount_micro)

    @property
    def local_amount(self):
        return from_kobo(self.local_amount_minor)


# # Your existing reference = your internal reference (keep it)
# reference = Column(String(128), unique=True, index=True, nullable=False)

# # Add these:
# provider_reference = Column(String(256), nullable=True, index=True)
# # ^ Paystack txn ID, Flutterwave txn ID, Cashramp order ID — whatever the provider returns

# tx_hash = Column(String(256), nullable=True, index=True)
# # ^ Solana tx signature, Ethereum tx hash — only populated for on-chain gateways

# chain_id = Column(String(64), nullable=True)
# # ^ "solana", "base", "celo" etc — only for web3, nullable for web2


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
    updated_at = Column(
        DateTime, default=datetime.now, onupdate=datetime.now, nullable=False
    )

    user = relationship("User", back_populates="bank_accounts")


class OnChainWallet(Base):
    __tablename__ = "onchain_wallets"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)

    # The actual wallet address
    wallet_address = Column(String(255), unique=True, index=True, nullable=False)

    user_id = Column(PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    # ---- Blockchain Info ----
    chain_id = Column(String(50), default="484")  # Camp Network Mainnet
    network = Column(String(100), default="camp_network")
    wallet_type = Column(
        String(50), default="evm"
    )  # TODO Future support of other wallet "evm", "solana", etc.

    # ---- Status + Metadata ----
    is_default = Column(Boolean, default=False)  # user's primary wallet
    is_verified = Column(Boolean, default=False)  # signature-based verification
    connected_at = Column(DateTime, default=datetime.now)
    last_synced_at = Column(DateTime, nullable=True)

    # Optional JSON for storing arbitrary metadata (e.g. balances)
    wallet_metadata = Column(JSON, default=dict)

    # Relationship
    user = relationship("User", back_populates="onchain_wallets")
