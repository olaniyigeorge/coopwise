import hmac
import hashlib
from fastapi import APIRouter, Request, Header, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.core.config import config
from db.dependencies import get_async_db_session
from db.models.payment_model import Payment
from db.models.contribution_model import Contribution
from app.services.payment_service import PaymentService

router = APIRouter(
    prefix="/api/v1/payments",
    tags=["Payments"]
)

PAYSTACK_WHITELIST = ["52.31.139.75", "52.49.173.169", "52.214.14.220"]


@router.post("/paystack/webhook", summary="Paystack Webhook Handler")
async def paystack_webhook(
    request: Request,
    x_paystack_signature: Optional[str] = Header(None),
    x_forwarded_for: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_async_db_session)
):
    """
    Handles Paystack Webhook notifications and updates the contribution/payment records.
    """
    body = await request.body()

    # Step 1: Verify source IP and signature
    if x_forwarded_for not in PAYSTACK_WHITELIST:
        raise HTTPException(status_code=403, detail="Invalid IP address")

    secret = config.PAYSTACK_SECRET_KEY.encode("utf-8")
    expected_signature = hmac.new(secret, body, hashlib.sha512).hexdigest()

    if x_paystack_signature != expected_signature:
        raise HTTPException(status_code=403, detail="Invalid signature")

    # Step 2: Deserialize JSON payload
    payload = await request.json()
    event = payload.get("event")
    data = payload.get("data", {})
    reference = data.get("reference")
    status_ = data.get("status")
    amount = data.get("amount") / 100  # Convert back to naira

    if event != "charge.success" or status_ != "success":
        return {"message": "Ignored non-success event."}

    try:
        # Step 3: Fetch the related contribution & payment by reference
        payment = await PaymentService.get_payment_by_reference(reference, db)

        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found.")

        if payment.status == "successful":
            return {"message": "Payment already processed."}

        # Step 4: Update payment record
        payment.status = "successful"
        payment.amount_paid = amount
        payment.channel = data.get("channel")
        payment.paid_at = data.get("paid_at")
        await db.commit()

        # Step 5: Update related contribution record
        contribution = await Contribution.get(db=db, id=payment.contribution_id)
        if contribution:
            contribution.status = "completed"
            contribution.paid_at = payment.paid_at
            await db.commit()

        return {"message": "Payment and contribution updated successfully."}

    except Exception as e:
        print("Webhook processing error:", str(e))
        raise HTTPException(status_code=500, detail="Webhook processing failed.")
