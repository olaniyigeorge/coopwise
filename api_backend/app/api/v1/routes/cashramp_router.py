from typing import Optional
from fastapi import APIRouter, Depends

from app.core.dependencies import get_cashramp_service
from app.services.cashramp_service import (
    CashRampService,
    CustomerResponse,
    InitiateDepositResponse,
    RampQuoteResponse,
)


router = APIRouter(prefix="/api/v1/cashramp", tags=["CashRamp"])


@router.get("/account-info", summary="Get merchant account information")
async def get_account_info(cashramp: CashRampService = Depends(get_cashramp_service)):
    """
    Retrieves the current merchant account info from CacheRAMP, including balance.
    """
    return await cashramp.get_account_info()


@router.post("/customer", response_model=CustomerResponse)
async def create_customer(
    email: str,
    first_name: str,
    last_name: str,
    country_id: str,
    cashramp: CashRampService = Depends(get_cashramp_service),
):
    return await cashramp.create_customer(email, first_name, last_name, country_id)


@router.get("/quote", response_model=RampQuoteResponse)
async def get_quote(
    amount: float,
    currency: str,
    customer_id: str,
    payment_type: str,
    payment_method_type: str,
    cashramp: CashRampService = Depends(get_cashramp_service),
):
    return await cashramp.get_ramp_quote(
        amount, currency, customer_id, payment_type, payment_method_type
    )


@router.post("/deposit", response_model=InitiateDepositResponse)
async def initiate_deposit(
    ramp_quote_id: str,
    reference: Optional[str] = None,
    cashramp: CashRampService = Depends(get_cashramp_service),
):
    return await cashramp.initiate_deposit(ramp_quote_id, reference)


@router.post("/deposit/paid")
async def mark_deposit_as_paid(
    payment_request_id: str,
    receipt_url: Optional[str] = None,
    cashramp: CashRampService = Depends(get_cashramp_service),
):
    return await cashramp.mark_deposit_as_paid(payment_request_id, receipt_url)


@router.post("/deposit/cancel")
async def cancel_deposit(
    payment_request_id: str, cashramp: CashRampService = Depends(get_cashramp_service)
):
    return await cashramp.cancel_deposit(payment_request_id)
