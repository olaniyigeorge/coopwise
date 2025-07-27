from typing import Optional
from pydantic import BaseModel, HttpUrl


class CustomerResponse(BaseModel):
    id: str
    email: str
    firstName: str
    lastName: str


class RampQuoteResponse(BaseModel):
    id: str
    exchangeRate: float
    paymentType: str


class InitiateDepositResponse(BaseModel):
    id: str
    status: str
    agent: str
    paymentDetails: str
    exchangeRate: float
    amountLocal: float
    amountUsd: float
    expiresAt: str
