from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

from src.domains.payments.models import PayoutStatus


class SubAccount(BaseModel):
    id: str


class PaystackPayload(BaseModel):
    amount: int = Field(
        ...,
        json_schema_extra={
            "example": 100,
            "description": "This is the amount to be charged.",
        },
    )
    email: str = Field(
        ...,
        json_schema_extra={
            "example": "user@flw.com",
            "description": "This is the email address of the customer",
        },
    )
    currency: str = Field(
        ...,
        json_schema_extra={
            "example": "NGN",
            "description": "This is the specified currency to charge in.",
        },
    )
    tx_ref: str = Field(
        ...,
        json_schema_extra={
            "example": "MC-MC-1585230ew9v5050e8",
            "description": "Unique reference for the transaction",
        },
    )
    fullname: Optional[str] = Field(
        "Yemi Desola",
        json_schema_extra={"description": "Customer's full name (first and last)"},
    )
    phone_number: Optional[str] = Field(
        "07033002245",
        json_schema_extra={"description": "Phone number linked to customer's account"},
    )
    client_ip: Optional[str] = Field(
        "154.123.220.1", json_schema_extra={"description": "IP address of the customer"}
    )
    device_fingerprint: Optional[str] = Field(
        "62wd23423rq324323qew1",
        json_schema_extra={"description": "Fingerprint of the device used"},
    )
    meta: Optional[Dict[str, Any]] = Field(
        None, json_schema_extra={"description": "Additional payment information"}
    )
    subaccounts: Optional[List["SubAccount"]] = Field(
        None,
        json_schema_extra={
            "description": "Array of subaccount objects for split payments"
        },
    )
    narration: Optional[str] = Field(
        None,
        json_schema_extra={
            "description": "Narration shown to the customer during debit"
        },
    )
    is_permanent: Optional[bool] = Field(
        False,
        json_schema_extra={"description": "If true, creates a static account number"},
    )


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


class MyPayoutRead(BaseModel):
    id: UUID
    group_id: UUID
    group_name: str
    round_number: int
    amount: Decimal
    currency: str
    status: PayoutStatus
    failure_reason: str | None = None
    created_at: datetime
    completed_at: datetime | None = None


class UpcomingPayoutRead(BaseModel):
    group_id: UUID
    group_name: str
    strategy: str
    trigger: str
    is_my_turn: bool
    next_recipient_name: str | None = None
    payable_amount: float | None = None
    currency: str
    round_number: int
    funded: bool
    inflight: bool
    can_trigger: bool


class PayoutRecordRead(BaseModel):
    id: UUID
    group_id: UUID
    user_id: UUID
    round_number: int
    amount: Decimal
    currency: str
    status: PayoutStatus
    provider: str
    provider_reference: str | None = None
    failure_reason: str | None = None
    created_at: datetime
    completed_at: datetime | None = None

    model_config = {"from_attributes": True}
