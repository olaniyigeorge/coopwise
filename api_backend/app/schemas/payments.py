from datetime import datetime
import enum
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List, Dict, Any

from sqlalchemy import JSON

from db.models.payment_model import PaymentGateway, PaymentStatus


class SubAccount(BaseModel):
    id: str

class PaystackPayload(BaseModel):
    amount: int = Field(..., example=100, description="This is the amount to be charged.")
    email: str = Field(..., example="user@flw.com", description="This is the email address of the customer")
    currency: str = Field(..., example="NGN", description="This is the specified currency to charge in.")
    tx_ref: str = Field(..., example="MC-MC-1585230ew9v5050e8", description="Unique reference for the transaction")
    fullname: Optional[str] = Field("Yemi Desola", description="Customer's full name (first and last)")
    phone_number: Optional[str] = Field("07033002245", description="Phone number linked to customer's account")
    client_ip: Optional[str] = Field("154.123.220.1", description="IP address of the customer")
    device_fingerprint: Optional[str] = Field("62wd23423rq324323qew1", description="Fingerprint of the device used")
    meta: Optional[Dict[str, Any]] = Field(None, description="Additional payment information")
    subaccounts: Optional[List[SubAccount]] = Field(None, description="Array of subaccount objects for split payments")
    narration: Optional[str] = Field(None, description="Narration shown to the customer during debit")
    is_permanent: Optional[bool] = Field(False, description="If true, creates a static account number")


class AuthorizationMeta(BaseModel):
    transfer_reference: str
    transfer_account: str
    transfer_bank: str
    account_expiration: str
    transfer_note: str
    transfer_amount: int
    mode: str


class ChargeResponseMeta(BaseModel):
    authorization: AuthorizationMeta


class ChargeResponse(BaseModel):
    status: str
    message: str
    meta: ChargeResponseMeta




# ----------       COOPWISE PAYMENT       ----------    


class PaymentMethod(enum.Enum):
  BANK_TRANSFER = 'bank_transfer',
  CARD = 'card',
  USSD = 'ussd',
  MOBILE_MONEY = 'mobile_money',
  CASH = 'cash'


class PaymentCreate(BaseModel):
    user_id: UUID
    contribution_id: Optional[UUID]
    amount: float
    currency: str
    note: Optional[str]

    gateway: PaymentGateway
    status: PaymentStatus
    transaction_reference: str
    payment_method: PaymentMethod
    provider_response: JSON
    metadata: JSON
    created_at:datetime
    updated_at : datetime
    
    payment_method: PaymentMethod
    description: str = None


class PaymentDetails(BaseModel):
    """
    Schema for payment data.
    """
    id: UUID
    user_id: UUID
    contribution_id: UUID
    amount: float
    currency: str
    note: str
    gateway: PaymentGateway
    status: PaymentStatus
    transaction_reference: str
    payment_method: PaymentMethod
    provider_response: JSON
    metadata: JSON
    created_at:datetime
    updated_at : datetime


    model_config = ConfigDict(from_attributes=True)
