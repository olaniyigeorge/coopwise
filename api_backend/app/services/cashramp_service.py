from typing import Optional
import httpx
from app.schemas.cashramp_schemas import InitiateDepositResponse
from app.core.config import config  





ACCURUE_STAGING_URL = "https://staging.api.useaccrue.com/cashramp/api/graphql"
ACCURUE_PROD_URL = "https://api.useaccrue.com/cashramp/api/graphql"

CASHRAMP_API_URL = ACCURUE_PROD_URL if config.ENV == "prod" else ACCURUE_STAGING_URL



async_client = httpx.AsyncClient(
    base_url=CASHRAMP_API_URL,
    headers={
        "Authorization": f"Bearer {config.CASHRAMP_SECKEY}",
        "Content-Type": "application/json",
    },
)


async def deposit_with_cashramp(quote_id: str, reference: Optional[str] = None) -> InitiateDepositResponse:
    """
    Initiates a deposit via CashRamp GraphQL.
    """
    query = """
    mutation InitiateDeposit($rampQuote: ID!, $reference: String) {
      initiateRampQuoteDeposit(rampQuote: $rampQuote, reference: $reference) {
        id
        status
        agent
        paymentDetails
        exchangeRate
        amountLocal
        amountUsd
        expiresAt
      }
    }
    """
    variables = {
        "rampQuote": quote_id,
        "reference": reference
    }

    async with async_client as client:
        response = await client.post(
            CASHRAMP_API_URL,
            json={"query": query, "variables": variables},
            headers={"Authorization": f"Bearer {config.CASHRAMP_SECKEY}"}
        )
        data = response.json()

    result = data["data"]["initiateRampQuoteDeposit"]
    return InitiateDepositResponse(**result)


async def mark_deposit_as_paid(payment_request_id: str, receipt_url: Optional[str] = None):
    """
    Marks a deposit as paid using CashRamp GraphQL.
    """
    query = """
    mutation MarkDepositPaid($paymentRequest: ID!, $receipt: String) {
      markDepositAsPaid(paymentRequest: $paymentRequest, receipt: $receipt)
    }
    """
    variables = {
        "paymentRequest": payment_request_id,
        "receipt": receipt_url
    }

    async with async_client as client:
        response = await client.post(
            CASHRAMP_API_URL,
            json={"query": query, "variables": variables},
            headers={"Authorization": f"Bearer {config.CASHRAMP_SECKEY}"}
        )
        return response.json()







