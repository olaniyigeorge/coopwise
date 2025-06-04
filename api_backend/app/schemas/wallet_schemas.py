
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Literal

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
