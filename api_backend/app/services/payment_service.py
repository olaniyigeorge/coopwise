from decimal import Decimal
import requests
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import Depends, HTTPException, status

from app.schemas.auth import AuthenticatedUser
from app.schemas.wallet_schemas import WalletLedgerCreate
from app.services.wallet_service import WalletService
from app.core.dependencies import get_cashramp_service
from app.services.cashramp_service import CashRampService
from db.models.wallet_models import LocalCurrency
from app.core.config import config
from app.schemas.payments import ChargeResponse, PaystackPayload
from app.utils.logger import logger

COOPWISE_USD_NGN_RATE = 1/1600

class PaymentService:
   
    
    @staticmethod
    async def init_pay_with_paystack(payload: PaystackPayload) -> ChargeResponse | None:
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
                    "sideNote": getattr(payload.meta, "note", "Payment on Coopwise through API v1")
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
        logger.debug(f"\n\n{response.text}\n\n")

        res : ChargeResponse = response.json()

        return res

    @staticmethod
    async def init_pay_with_paystack_and_record(db: AsyncSession, user: AuthenticatedUser, payload: PaystackPayload)-> ChargeResponse | None:
        pay = await PaymentService.init_pay_with_paystack(payload)

        
        ledger_create = WalletLedgerCreate(
            wallet_id=user.id,
            type="deposit",
            stable_amount=(payload.amount*COOPWISE_USD_NGN_RATE),
            local_amount=payload.amount,
            local_currency="NGN",
            exchange_rate=COOPWISE_USD_NGN_RATE,
            status="initiated"
        )
        ledger = await WalletService.record_ledger_entry(ledger_create, db)

        return ledger
    
    @staticmethod
    async def pay_with_cashramp(
        amount: Decimal,
        currency: LocalCurrency,
        customer_id: str, 
        payment_type: str, # "deposit" | "withdraw",
        payment_method_type: str, #  "bank_transfer_ng" | "kuda_pay" # Dynamic from CashrampGraphQL
        reference: str,
        proof_of_payment: str # Flag from proof of payment like receipt_url, agent_decision, network_activity etc 
    ):
        #TODO  Open a realtime session 


        # Init CashrampServicse Deposit Flow
        cashramp: CashRampService = Depends(get_cashramp_service)
        
        # 1. Get a valid ramp quote
        ramp_quote = await cashramp.get_ramp_quote(amount, currency, customer_id, payment_type, payment_method_type)

    
        # 2. Initiate deposit with quote
        init_payment_data = await cashramp.initiate_deposit(ramp_quote.id, reference) 

        # 3. Share payment details with customer
        if init_payment_data.status == "initiated":
            return init_payment_data

        # 4. Verify payment 
        if init_payment_data.status == "pending": # Or payment verification is triggered
            check_payment = await cashramp.verify_deposit(payment_request_id=init_payment_data.id, proof=proof_of_payment)
        
        # 5. Mark deposit as paid
        if check_payment.status:
            deposit_data = cashramp.mark_deposit_as_paid(payment_request_id=init_payment_data.id, receipt_url=str) 

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
    

    @staticmethod
    async def confirm_payment(db: AsyncSession, user_id: str):
        """
        Confirm the payment
        """
        pass

    @staticmethod
    async def pay_with_solana():
        pass

    @staticmethod
    async def pay_with_coopwise_network():
        pass