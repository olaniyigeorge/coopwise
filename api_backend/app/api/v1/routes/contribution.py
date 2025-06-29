from datetime import datetime
from decimal import Decimal
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession


from db.models.contribution_model import ContributionStatus
from app.core.config import config
from app.services.cooperative_group_service import CooperativeGroupService
from app.core.dependencies import get_redis
from app.schemas.wallet_schemas import WalletDeposit
from app.services.wallet_service import WalletService
from app.schemas.notifications_schema import NotificationCreate
from app.services.notification_service import NotificationService
from app.services.payment_service import PaymentService
from app.services.user_service import UserService
from app.schemas.contribution_schemas import ContributionCreate, ContributionDetail
from app.api.v1.routes.auth import get_current_user, is_admin_permissions
from app.services.contribution_service import ContributionService
from app.schemas.auth import AuthenticatedUser
from db.dependencies import get_async_db_session


router = APIRouter(
    prefix="/api/v1/contributions",
    tags=["Contributions"]
)

CUTOFF_DATE = datetime.fromisoformat("2025-06-30T00:00:00") # Mock payment cutoff date


@router.post("/contribute", summary="Makes a contribution to a group")
async def contribute(
    contribution_data: ContributionCreate,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
    payment_gateway: str = "mock-success",  # cashramp Cashramp off-ramp as default
):
    """
    Makes a contribution of a specific amount to a cooperative group
    """


   
    user = await UserService.get_user_by_id(
        user_id=contribution_data.user_id,
        db=db
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    data = contribution_data.model_dump()
    data.update({
        "user_id": current_user.id,
        "status": contribution_data.status or ContributionStatus.PLEDGED,
    })
    print("\n\n\nContribution data being saved:", data, "\n\n\n")
    contribution_data = ContributionCreate(**data)


    contribution = await ContributionService.make_contribution(
        contribution_data, 
        current_user, 
        db
    )
    if not contribution:
        raise HTTPException(status_code=400, detail="Failed to make contribution.")

    #TODO: Validate contribution amount 

    # Choose from a list of payment gateways
    if payment_gateway == "paystack":
        from app.schemas.payments import PaystackPayload  # Import if not already
        payment_payload = PaystackPayload(
            amount=int(Decimal(contribution.amount) * 100),  # Paystack expects amount in kobo
            email=user.email,
            currency=contribution.currency,
            tx_ref=str(contribution.id),
            fullname=user.full_name,
            phone_number=user.phone_number,
            client_ip="154.123.220.1",  # Replace with actual client IP if available
            device_fingerprint="62wd23423rq324323qew1",  # Replace with actual fingerprint
            meta={
                "sideNote": contribution.note,
            },
            is_permanent=False
        )
        contribution_payment = await PaymentService.pay_with_paystack(payment_payload)
    elif payment_gateway == "cashramp":
        contribution_payment = await PaymentService.pay_with_cashramp(
            str(contribution.id), Decimal(contribution.amount)
        )
    elif payment_gateway == "on-chain_solana":
        # Implement Solana payment logic here
        contribution_payment = await PaymentService.pay_with_solana(
            str(contribution.id), Decimal(contribution.amount)
        )
    elif payment_gateway == "coopwise_network_on_solana":
        # Implement Coopwise network on Solana logic here
        contribution_payment = await PaymentService.pay_with_coopwise_network(
            str(contribution.id), Decimal(contribution.amount)
        )
    elif payment_gateway == "mock-success":
        if config.ENV != "dev" and datetime.now() > CUTOFF_DATE:
                raise HTTPException(status_code=400, detail="Mock payment is only available in production till 30th of June.")
        print("\nMocking successful payment for contribution:", contribution.id, "\n")
        contribution_payment = {"status": True, "data": {"amount": contribution.amount}}
    elif payment_gateway == "mock-fail":
        if config.ENV != "dev" and datetime.now() > CUTOFF_DATE:
                raise HTTPException(status_code=400, detail="Mock payment is only available in production till 30th of June.")
        print("\nMocking failed contribution payment \n")
        contribution_payment = {"status": False, "message": "Payment failed", "data": {"amount": contribution.amount}}
        raise HTTPException(status_code=400, detail=f"{contribution_payment}")
    else:
        raise HTTPException(status_code=400, detail="Unsupported payment gateway.")


    #TODO Wrap all payment into similar structure to check validity without relying on the payment gateway's response structure
    if not contribution_payment.get("status", False):
        noti_data = NotificationCreate(
            user_id = contribution.user_id,
            title = "Payment Failed",
            message = f"We could not process your payment of {contribution.amount} for your contribution {contribution.id}",
            event_type = "transaction",
            type = "error",
            entity_url = f"contribution:{contribution.id}-amount:{contribution.amount}"
        )
        await NotificationService.create_and_push_notification_to_user(
            noti_data, db
        )
        raise HTTPException(status_code=400, detail="Payment failed.")
    
    group = await CooperativeGroupService.get_coop_group_by_id(
        db, coop_group_id=contribution.group_id
    )
    noti_data = NotificationCreate(
        user_id = contribution.user_id,
        title = "Contribution Successful",
        message = f"You have successfully made a contribution of {contribution.currency}{contribution.amount} into {group.name}.",
        event_type = "contribution",
        type = "success",
        entity_url = f"contribution:{contribution.id}-group:{group.id}"
    )
    await NotificationService.create_and_push_notification_to_user(
        noti_data, db
    )
    
    noti_data = NotificationCreate(
        user_id = contribution.user_id,
        title = "Payment Successful",
        message = f"We settled your payment into {contribution_payment['data']['amount']} for your contribution {contribution.id}",
        event_type = "transaction",
        type = "success",
        entity_url = f"payment-{contribution.user_id}:{contribution.amount}"
    )
    await NotificationService.create_and_push_notification_to_user(
        noti_data, db
    )

    deposit_data = WalletDeposit(
        local_amount = Decimal(contribution.amount),
        currency="NGN"
    )

    wallet = await WalletService.deposit(deposit_data, db, user, redis = Depends(get_redis))
    
    return {
        "message": "Contribution made successfully.",
        "contribution": contribution,
        "charge_response": contribution_payment,
        "wallet": wallet
    }

   
@router.get("/{contribution_id}")
async def get_contribution(  
        contribution_id: UUID,
        db: AsyncSession = Depends(get_async_db_session),
        current_user: AuthenticatedUser = Depends(get_current_user)
    ):
    """
        Fetch a contribtion by ID.
    """
    contribution= await ContributionService.get_contribution_by_id(db, contribution_id)
    if not contribution:
        raise HTTPException(status_code=404, detail="Contribution not found")
    return contribution



@router.get("/")
async def get_contributions(
    skip: int = 0, limit: int = 10, 
    user: AuthenticatedUser = Depends(is_admin_permissions), 
    db: AsyncSession = Depends(get_async_db_session)
) -> List[ContributionDetail]:
    """
        Fetch a list of contribution with optional pagination.
    """
    if not user:
        raise HTTPException(status_code=401, detail="Invalid login credentials")
    return await ContributionService.get_contributions(db, skip=skip, limit=limit)

