from datetime import datetime
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.services.payment_service import PaymentService
from app.services.user_service import UserService
from app.schemas.contribution_schemas import ContributionCreate
from app.api.v1.routes.auth import get_current_user
from app.schemas.payments import PaystackPayload
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

    #print(f"\nContribution data: {contribution_data}\n")
    contribution_data = ContributionCreate(
        user_id=contribution_data.user_id,
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

    
    payment_payload = PaystackPayload(
        amount=contribution.amount * 100,  
        email=user.email,
        currency="NGN",
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
    print(f"\nContribution payment: {contribution_payment}\n")
    
    return {
        "message": "Contribution made successfully.",
        "contribution": contribution,
        "charge_response": contribution_payment
    }

   