
import httpx
import os

GRAPHQL_URL = os.getenv("GRAPHQL_RATE_URL", "https://your-graphql.example.com/graphql")
API_KEY = os.getenv("GRAPHQL_API_KEY", None)  # if needed

async def fetch_exchange_rate(from_currency: str, to_currency: str) -> float:
    """
    Queries the GraphQL endpoint to get the current conversion rate: from_currency → to_currency.
    Returns a float rate (e.g. 0.00024 if 1 NGN = 0.00024 USDC).
    """
    query = """
    query GetExchangeRate($from: String!, $to: String!) {
      exchangeRate(from: $from, to: $to) {
        rate
      }
    }
    """
    variables = {"from": from_currency, "to": to_currency}
    headers = {"Content-Type": "application/json"}
    if API_KEY:
        headers["Authorization"] = f"Bearer {API_KEY}"

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            GRAPHQL_URL,
            json={"query": query, "variables": variables},
            headers=headers,
            timeout=10.0
        )
        resp.raise_for_status()
        data = resp.json()
        return float(data["data"]["exchangeRate"]["rate"])
