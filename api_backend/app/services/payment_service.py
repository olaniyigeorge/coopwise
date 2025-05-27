# Determine eligible payout member.

# Process or simulate rotating payouts.

# Record payout logs.



from uuid import UUID
from pydantic import BaseModel
import requests
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status

from app.core.config import config
from app.schemas.payments import ChargeResponse, PaystackPayload
from app.utils.logger import logger

class PaymentService:
   
    
    @staticmethod
    async def pay_with_paystack(payload: PaystackPayload) -> ChargeResponse | None:
        """
        Make a payment through paystack
        """
        # Simulate a payment request to Paystack
        logger.info(f"\n\n\n\nProcessing payment with Paystack: {payload}\n\n")
        # Here you would typically make an HTTP request to the Paystack API

        try:
            url = "https://api.flutterwave.com/v3/charges?type=bank_transfer"
        
            data = {
                "amount": payload.amount,
                "email": payload.email,
                "currency": payload.currency or "NGN",
                "tx_ref": payload.tx_ref or "CP-WS-000000000000",
                "fullname": payload.fullname or "John Doe",
                "phone_number": payload.phone_number or "08012345678",
                "client_ip": payload.client_ip or "154.123.220.1",
                "device_fingerprint": payload.device_fingerprint or "62wd23423rq324323qew1",
                "meta": {
                    "flightID": payload.tx_ref or "123949494DC",
                    "sideNote": getattr(payload.meta, "note", "Payment for some form of contribution")
                },
                "is_permanent": False
            }
            headers = {
                "accept": "application/json",
                "Authorization": f"Bearer FLWSECK_TEST-SANDBOXDEMOKEY-X",
                "Content-Type": "application/json"
            }

            response = requests.post(url, json=data, headers=headers)
        except Exception as e:
            logger.error(f"Error processing payment with Paystack: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Payment processing failed"
            )
        print(f"\n\n{response.text}")

        res = response.json()

        return ChargeResponse(
            **res
        )
    
    @staticmethod
    async def confirm_payment(db: AsyncSession, user_id: str):
        """
        Confirm the payment
        """
        pass