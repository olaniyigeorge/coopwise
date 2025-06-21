from decimal import Decimal
import requests
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status

from app.core.config import config
from app.schemas.payments import ChargeResponse, PaymentCreate, PaystackPayload
from app.utils.logger import logger
from db.models.payment_model import Payment, PaymentGateway, PaymentStatus

class PaymentService:
   
    
    @staticmethod
    async def pay_with_paystack(payload: PaystackPayload) -> ChargeResponse | None:
        """
        Make a payment through paystack
        """
        # Simulate a payment request to Paystack
        logger.info(f"\n\n\n\nProcessing payment with Paystack: {payload}\n\n")

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
                "Authorization": f"Bearer {config.PAYSTACK_SECRET_KEY}", # FLWSECK_TEST-SANDBOXDEMOKEY-X
                "Content-Type": "application/json"
            }

            response = requests.post(url, json=data, headers=headers)
        except Exception as e:
            logger.error(f"Error processing payment with Paystack: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Payment processing failed"
            )
        print(f"\n\n{response.text}\n\n")

        res : ChargeResponse = response.json()

        return res
    
    @staticmethod
    async def confirm_payment(db: AsyncSession, user_id: str):
        """
        Confirm the payment
        """
        pass


    @staticmethod
    async def create_payment(db: AsyncSession, payment_data: PaymentCreate):
        """
        Create payment object for this transaction.
        """
        try:
            # result = await db.execute(select(Payment).where(Payment.transaction_reference == user_data.email))
            # if result.scalars().first():
            #     raise HTTPException(status_code=400, detail="Email already registered")

            new_payment = Payment(
                user_id=payment_data.user_id,
                amount=payment_data.amount,
                currency=payment_data.currency,
                payment_method=payment_data.payment_method,
                note=payment_data.note or "",
                gateway=payment_data.gateway or PaymentGateway.OTHER.value,
                status=payment_data.status or PaymentStatus.INITIATED.value,
                transaction_reference=payment_data.transaction_reference or None
            )

            db.add(new_payment)
            await db.commit()
            await db.refresh(new_payment)
            return new_payment

        except Exception as e:
            logger.error(f"Payment creation failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not create payment"
            )



    @staticmethod
    async def pay_with_cashramp(reference: str, amount: Decimal):
        
        # Init Deposit Flow
        # cashramp_teller = CashRampService.deposit(reference)

        # 1. Get a valid ramp quote
        # ramp_quote: RampQuote = await cashramp_teller.get_ramp_quote() 

        # 2. Initiate deposit with quote
        # init_payment_data: PaymentDetails = await cashramp_teller.init_deposit(deposit_data, ramp_quote) 

        # 3. Share payment details with customer
        # if init_payment_data.status == "pending" return early with payment_details

        # 4. Mark deposit as paid
        # if init_payment_data.status == "completed"
        # deposit_data = cashramp_teller.mark_deposit(status="paid") 

        # 5. Receive stablecoin settlement
        # Check cashramp balance again to confirm

        


        return {
            "status": "success",
            "message": "Payment Successful",
            "data" : {
                "amount": amount,
                "reference": reference
            }
        }