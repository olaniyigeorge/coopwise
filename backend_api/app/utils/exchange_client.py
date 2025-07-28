import httpx
import os

from app.core.config import config


CASHRAMP_SECKEY = config.CASHRAMP_SECKEY or None

ACCURUE_STAGING_URL = "https://staging.api.useaccrue.com/cashramp/api/graphql"
ACCURUE_PROD_URL = "https://api.useaccrue.com/cashramp/api/graphql"


async def fetch_exchange_rate(
    amount: float,
    customer_id: str,
    paymentType: str,
    paymentMethodType: str,
    from_currency: str = "usd",
) -> float:
    """
    Queries the GraphQL endpoint to get the current conversion rate: from_currency → to_currency.
    Returns a float rate (e.g. 0.00024 if 1 NGN = 0.00024 USDC).
    """
    # '{
    #     "query": "{ account { id accountBalance } }"
    #   }'
    # query = """
    # query GetExchangeRate($from: String!, $to: String!) {
    #   exchangeRate(from: $from, to: $to) {
    #     rate
    #   }
    # }
    # """

    query = """
      query {
          rampQuote(
            amount: 100
            currency: usd
            customer: "VHlwZXM6OkNhc2hyYW1wOjpBUEk6Ok1lcmNoYW50Q3VzdG9tZXItMzgwYzEwZTctNzgwNC00MmU3LWI2NTItYWNiMGQ5OTA4NDYy"
            paymentType: deposit
            paymentMethodType: "bank_transfer_ng"
          ) {
            id
            exchangeRate
            paymentType
          }
        }
    """
    variables = {"currency": from_currency, "customer_id": customer_id}
    headers = {"Content-Type": "application/json"}
    if CASHRAMP_SECKEY:
        headers["Authorization"] = f"Bearer {CASHRAMP_SECKEY}"

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            ACCURUE_STAGING_URL,
            json={"query": query, "variables": variables},
            headers=headers,
            timeout=10.0,
        )
        resp.raise_for_status()
        data = resp.json()
        logger.info(f"\nACCURE XG Quote Response: {data}\n")
        return float(data["data"]["exchangeRate"]["rate"])
