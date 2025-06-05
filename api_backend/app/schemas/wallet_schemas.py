
from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Literal

from db.models.wallet_models import LocalCurrency

class WalletCreate(BaseModel):
    user_id: UUID
    local_currency: Literal["NGN", "GHS", "KES"]  # match LocalCurrency enum

class WalletDeposit(BaseModel):
    local_amount: float  # e.g. 5000.00
    currency: Literal["NGN", "GHS", "KES"]

class WalletWithdraw(BaseModel):
    stable_amount: float  # how much stable coin to withdraw

class WalletBalance(BaseModel):
    stable_coin_balance: float
    local_currency: str
    local_currency_balance: float  # derived via rate
    as_of: datetime

class WalletDetail(BaseModel):
    id: UUID
    user_id: UUID
    stable_coin_balance: int
    local_currency: LocalCurrency
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)












# ----------------- wallet_ledger -----------


class WalletLedger(BaseModel):
    id: UUID
    wallet_id: UUID
    stable_amount: int
    local_currency: LocalCurrency
    exchange_rate: float
    created_at: datetime


