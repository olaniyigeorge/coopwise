from gql import Client, gql
from gql.transport.aiohttp import AIOHTTPTransport
from pydantic import BaseModel
from redis import Redis
from typing import Optional, Dict, Any
import json

from app.schemas.cashramp_schemas import CustomerResponse, InitiateDepositResponse, RampQuoteResponse
from app.core.config import config


CASHRAMP_URL = "https://api.useaccrue.com/cashramp/api/graphql" if config.ENV == "dev" else "https://staging.api.useaccrue.com/cashramp/api/graphql"  #TODO Flip this to use staging in dev. CashRamp not providing staging API KEYS
QUOTE_CACHE_TTL = 60  # Per Cashramp's recommendation, cache quotes of 30 to 180 seconds


class CashRampError(Exception):
    """Custom exception for CashRamp errors."""
    #TODO Implement error handling while dealing with Accrue Cashramp's graphql API
    pass


class PaymentVerificationResponse(BaseModel):
    status: bool
    message: str
    receipt_url: str # url

# ----------------------  CASHRAMP SERVICE  ----------------------

class CashRampService:
    def __init__(self, redis: Redis):
        self.redis = redis
        transport = AIOHTTPTransport(url=CASHRAMP_URL, headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {config.CASHRAMP_SECKEY}"
        })
        self.client = Client(transport=transport, fetch_schema_from_transport=True)

    async def get_account_info(self) -> Dict:
        query = """
        query {
            account {
                id
                accountBalance
            }
        }
        """
        # print(f"\nFetching account info from {CASHRAMP_URL} with {query}\n")
        result = await self.client.execute_async(gql(query))
        return result.get("account", {})

    async def create_customer(self, email: str, first_name: str, last_name: str, country_id: str) -> CustomerResponse:
        query = gql("""
        mutation ($email: String!, $firstName: String!, $lastName: String!, $country: ID!) {
            createCustomer(email: $email, firstName: $firstName, lastName: $lastName, country: $country) {
                id
                email
                firstName
                lastName
            }
        }
        """)
        variables = {
            "email": email,
            "firstName": first_name,
            "lastName": last_name,
            "country": country_id,
        }
        async with self.client as session:
            result = await session.execute(query, variable_values=variables)
        return CustomerResponse(**result['createCustomer'])

    async def get_customer(self):
        pass

    async def get_ramp_quote(self, amount: float, currency: str, customer_id: str, payment_type: str, payment_method_type: str) -> RampQuoteResponse:
        cache_key = f"ramp_quote:{customer_id}:{amount}:{currency}:{payment_type}:{payment_method_type}"
        cached = await self.redis.get(cache_key)

        if cached:
            print(f"\n Returning cached ramp quote  {cached}\n")
            return RampQuoteResponse(**json.loads(cached))

        query = gql("""
        query ($amount: Decimal!, $currency: P2PPaymentCurrency!, $customer: ID!, $paymentType: PaymentType!, $paymentMethodType: String!) {
            rampQuote(amount: $amount, currency: $currency, customer: $customer, paymentType: $paymentType, paymentMethodType: $paymentMethodType) {
                id
                exchangeRate
                paymentType
            }
        }
        """)
        variables = {
            "amount": amount,
            "currency": currency,
            "customer": customer_id,
            "paymentType": payment_type,
            "paymentMethodType": payment_method_type,
        }

        print(f"\nFetching ramp quote using {self.client} with {query}\n")
        async with self.client as session:
            result = await session.execute(query, variable_values=variables)
        data = RampQuoteResponse(**result['rampQuote'])

        self.redis.setex(cache_key, QUOTE_CACHE_TTL, json.dumps(data.model_dump()))
        return data

    async def initiate_deposit(self, ramp_quote_id: str, reference: Optional[str] = None) -> InitiateDepositResponse:
        query = gql("""
        mutation ($rampQuote: ID!, $reference: String) {
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
        """)
        variables = {
            "rampQuote": ramp_quote_id,
            "reference": reference
        }
        async with self.client as session:
            result = await session.execute(query, variable_values=variables)
        return InitiateDepositResponse(**result['initiateRampQuoteDeposit'])

    async def verify_deposit(self, payment_request_id: str, proof: Optional[str] = None) -> PaymentVerificationResponse:
        # Mock True
        return {
            "status": True,
            "message": "Payment confirmed",
            "receipt_url": "https:coopwise.vercel.app/receipts/0"
        }
    
    async def mark_deposit_as_paid(self, payment_request_id: str, receipt_url: Optional[str] = None) -> Dict[str, Any]:
        query = gql("""
        mutation ($paymentRequest: ID!, $receipt: String) {
            markDepositAsPaid(paymentRequest: $paymentRequest, receipt: $receipt)
        }
        """)
        variables = {
            "paymentRequest": payment_request_id,
            "receipt": receipt_url
        }
        async with self.client as session:
            result = await session.execute(query, variable_values=variables)
        return result['markDepositAsPaid']

    async def cancel_deposit(self, payment_request_id: str) -> Dict[str, Any]:
        query = gql("""
        mutation ($paymentRequest: ID!) {
            cancelDeposit(paymentRequest: $paymentRequest)
        }
        """)
        variables = {"paymentRequest": payment_request_id}

        async with self.client as session:
            result = await session.execute(query, variable_values=variables)
        return result['cancelDeposit']
