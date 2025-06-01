from datetime import datetime
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List


from app.schemas.notifications_schema import NotificationCreate
from app.services.notification_service import NotificationService
from app.services.payment_service import PaymentService
from app.services.user_service import UserService
from app.schemas.contribution_schemas import ContributionCreate
from app.api.v1.routes.auth import get_current_user
from app.schemas.payments import PaymentCreate, PaystackPayload
from app.services.contribution_service import ContributionService
from app.schemas.auth import AuthenticatedUser
from db.dependencies import get_async_db_session


router = APIRouter(
    prefix="/api/v1/contributions",
    tags=["Contributions"]
)


@router.post("/contribute", summary="Makes a contribution to a group")
async def contribute(
    contribution_data: ContributionCreate,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Makes a contribution of a specific amount to a cooperatie group 
    """
    # Check is user has a membership to thE coop
    # If no, return early with a msg(use are not a member of this cooperative)
    # If yes, make payment
    # if payment successfull
    # mark user's membership as paid for the month


    contribution_data = ContributionCreate(
        user_id=current_user.id,
        group_id=contribution_data.group_id,
        currency=contribution_data.currency,

        amount=contribution_data.amount,
        note=contribution_data.note,
    )

    user = await UserService.get_user_by_id(
        user_id=contribution_data.user_id,
        db=db
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    # print(f"\nUser: {user}\n")
    
    contribution = await ContributionService.make_contribution(
        contribution_data, 
        current_user, 
        db
    )
    if not contribution:
        raise HTTPException(status_code=400, detail="Failed to make contribution.")

    noti_data = NotificationCreate(
        user_id = contribution.user_id,
        title = "Contribution Successful",
        message = f"You have successfully made a contribution to your cooperative group.",
        event_type = "contribution",
        type = "success",
        entity_url = None
    )
    await NotificationService.create_and_push_notification_to_user(
        noti_data, db
    )
    
    payment_payload = PaystackPayload(
        amount=contribution.amount * 100,  
        email=user.email,
        currency=contribution.currency,
        tx_ref=str(contribution.id),
        fullname=user.full_name,
        phone_number=user.phone_number,
        client_ip="154.123.220.1",
        device_fingerprint="62wd23423rq324323qew1",
        meta={
            "flightID": "123949494DC",
            "sideNote": contribution.note,
        },
        is_permanent=False
    )

    contribution_payment = await PaymentService.pay_with_paystack(
        payment_payload
    ) 
    if not contribution_payment.get("status", False):
        raise HTTPException(status_code=400, detail="Payment failed.")
    

    noti_data = NotificationCreate(
        user_id = contribution.user_id,
        title = "Payment Successful",
        message = f"You have successfully made a payment for your contribution.",
        event_type = "transaction",
        type = "success",
        entity_url = None
    )
    await NotificationService.create_and_push_notification_to_user(
        noti_data, db
    )
    
    print(f"\nContribution payment: {contribution_payment}\n")
    
    return {
        "message": "Contribution made successfully.",
        "contribution": contribution,
        "charge_response": contribution_payment
    }

   

@router.post("/add_money", summary="Deposit money into your coopwise account")
async def deposit(
    deposit_data: PaymentCreate,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Deposits money into your Coopwise account. 
    """

    #print(f"\nContribution data: {contribution_data}\n")
    deposit = PaymentCreate(
        user_id=current_user.id,
        group_id=deposit_data.group_id,
        currency=deposit_data.currency,

        amount=deposit_data.amount,
        note=deposit_data.note,
    )

    payment = await PaymentService.create_payment(
        db=db,
        payment_data=deposit
        
    )
    if not payment:
        raise HTTPException(status_code=404, detail="User not found.")

    user = await UserService.get_user_by_id(
        user_id=current_user.id,
        db=db
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    
    payment_payload = PaystackPayload(
        amount=payment.amount * 100,  
        email=user.email,
        currency=payment.currency,
        tx_ref=str(payment.id),
        fullname=user.full_name,
        phone_number=user.phone_number,
        client_ip="154.123.220.1",
        device_fingerprint="62wd23423rq324323qew1",
        meta={
            "flightID": "123949494DC",
            "sideNote": payment.note,
        },
        is_permanent=False
    )

    charge_response = await PaymentService.pay_with_paystack(
        payment_payload
    ) 
    print(f"\Charge response: {charge_response}\n")
    
    return {
        "message": "Deposit successful.",
        "payment": payment,
        "charge_response": charge_response
    }

@router.post("/withdraw")
async def withdraw(  
    amount: float,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    # check wallet for balance 
    # If balance gte amount continue
    # If user does not have a missed contribution continue
    # transfer amount to user's account
    pass