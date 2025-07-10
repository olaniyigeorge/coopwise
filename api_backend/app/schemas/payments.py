from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any





class SubAccount(BaseModel):
    id: str


class PaystackPayload(BaseModel):
    amount: int = Field(..., json_schema_extra={"example": 100, "description": "This is the amount to be charged."})
    email: str = Field(..., json_schema_extra={"example": "user@flw.com", "description": "This is the email address of the customer"})
    currency: str = Field(..., json_schema_extra={"example": "NGN", "description": "This is the specified currency to charge in."})
    tx_ref: str = Field(..., json_schema_extra={"example": "MC-MC-1585230ew9v5050e8", "description": "Unique reference for the transaction"})
    fullname: Optional[str] = Field("Yemi Desola", json_schema_extra={"description": "Customer's full name (first and last)"})
    phone_number: Optional[str] = Field("07033002245", json_schema_extra={"description": "Phone number linked to customer's account"})
    client_ip: Optional[str] = Field("154.123.220.1", json_schema_extra={"description": "IP address of the customer"})
    device_fingerprint: Optional[str] = Field("62wd23423rq324323qew1", json_schema_extra={"description": "Fingerprint of the device used"})
    meta: Optional[Dict[str, Any]] = Field(None, json_schema_extra={"description": "Additional payment information"})
    subaccounts: Optional[List["SubAccount"]] = Field(None, json_schema_extra={"description": "Array of subaccount objects for split payments"})
    narration: Optional[str] = Field(None, json_schema_extra={"description": "Narration shown to the customer during debit"})
    is_permanent: Optional[bool] = Field(False, json_schema_extra={"description": "If true, creates a static account number"})

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



