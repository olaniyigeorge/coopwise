from decimal import Decimal
from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Literal, Optional

from db.models.wallet_models import (
    LedgerStatus,
    LedgerType,
    LocalCurrency,
    PaymentGateway,
    StableCurrency,
)


class WalletCreate(BaseModel):
    user_id: UUID
    local_currency: Literal["NGN", "GHS", "KES"]  # match LocalCurrency enum


class WalletDeposit(BaseModel):
    local_amount: Decimal
    currency: Literal["NGN", "GHS", "KES"]


class WalletWithdraw(BaseModel):
    local_amount: Decimal


class WalletBalance(BaseModel):
    stable_coin_balance: Decimal
    local_currency: str
    local_currency_balance: float
    as_of: datetime


class WalletDetail(BaseModel):
    id: UUID
    user_id: UUID
    stable_coin_balance: Decimal
    local_currency: LocalCurrency
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ----------------- wallet_ledger -----------


class WalletLedgerDetail(BaseModel):
    id: UUID
    wallet_id: UUID
    reference: str
    type: LedgerType
    stable_amount: float
    stable_currency: StableCurrency
    local_amount: float
    local_currency: LocalCurrency
    exchange_rate: float
    gateway: PaymentGateway
    status: LedgerStatus
    note: Optional[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class WalletLedgerCreate(BaseModel):
    wallet_id: UUID
    reference: str
    type: LedgerType
    stable_amount: float
    stable_currency: StableCurrency = StableCurrency.usdc
    local_amount: float
    local_currency: LocalCurrency
    exchange_rate: float
    gateway: PaymentGateway = PaymentGateway.cashramp
    status: LedgerStatus = LedgerStatus.initiated
    note: Optional[str] = None
