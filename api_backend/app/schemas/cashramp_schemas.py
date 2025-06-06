
from pydantic import BaseModel, HttpUrl
from typing import Optional
from uuid import UUID
from decimal import Decimal
from datetime import datetime

class InitiateDepositRequest(BaseModel):
    ramp_quote: str  # quote ID
    reference: Optional[str] = None  # your custom reference

class InitiateDepositResponse(BaseModel):
    id: str
    status: str
    agent: str
    paymentDetails: str
    exchangeRate: Decimal
    amountLocal: Decimal
    amountUsd: Decimal
    expiresAt: datetime

class MarkDepositAsPaidRequest(BaseModel):
    paymentRequest: str
    receipt: Optional[HttpUrl] = None
