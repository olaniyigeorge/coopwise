from datetime import datetime
from decimal import Decimal
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from redis.asyncio import Redis
from src.domains.users.service import UserService
from src.domains.users.infra.sqlalchemy_user_repository import SqlAlchemyUserRepository
from config import AppConfig as config
from src.domains.notifications.service import NotificationService
from src.domains.payments.service import PaymentService
from src.domains.wallets.models import (
    LedgerStatus,
    LedgerType,
    StableCurrency,
)
from src.domains.notifications.schemas import NotificationCreate
from src.infra.db.dependencies import get_async_db_session
from src.domains.wallets.service import MOCK_LOCAL_TO_STABLE_RATE, WalletService
from src.domains.auth.schemas import AuthenticatedUser
from src.domains.wallets.schemas import (
    WalletDeposit,
    WalletLedgerCreate,
    WalletWithdraw,
    WalletDetail,
    WalletWithdrawalDetail,
)
from src.domains.kyc.models import KYCStatus, KYCVerification
from src.infra.security.field_encryptor import FieldEncryptor
from src.api.middlewares.dependencies import get_current_user
from src.infra.cache.redis_client import get_redis
from src.shared.utils.logger import logger


router = APIRouter(prefix="/api/v1/wallet", tags=["Wallet"])

CUTOFF_DATE = datetime.fromisoformat("2025-12-07T00:00:00")  # Mock payment cutoff date


@router.post(
    "/deposit/initiate",
    # TODO Add a response model that works for all payment methods
    summary="Initiate deposit into your Coopwise wallet via supported payment gateway",
)
async def initiate_deposit(
    deposit_data: WalletDeposit,
    payment_gateway: str = "mock_success",
    db: AsyncSession = Depends(get_async_db_session),
    user: AuthenticatedUser = Depends(get_current_user),
    redis_client: Redis = Depends(get_redis),
):
    tx_ref_uuid = (
        uuid.uuid4()
    )  # TODO Check possibility of confirming if Unique transaction reference is not an existing wallet ledger record

    user_service = UserService(user_repo=SqlAlchemyUserRepository(db))
    user_detail = await user_service.get_user_by_id(user.id)

    # Choose from a list of payment gateways
    if payment_gateway == "paystack":
        from src.domains.payments.schemas import PaystackPayload

        payment_payload = PaystackPayload(
            amount=int(Decimal(deposit_data.local_amount) * 100),
            email=user.email,
            currency=deposit_data.currency,
            tx_ref=str(tx_ref_uuid),
            fullname=user_detail.full_name,
            phone_number=user_detail.phone_number,
            client_ip="154.123.220.1",
            device_fingerprint="62wd23423rq324323qew1",  # TODO Read more about device_fingerprints
            meta={
                "sideNote": "Deposit into Coopwise wallet",
            },
            is_permanent=False,
        )
        # deposit_payment = await PaymentService.init_pay_with_paystack(payment_payload)
        try:
            init_payment_response = await PaymentService.init_pay_with_paystack(
                payment_payload, channels=None
            )
        except Exception:
            await NotificationService.notify_transaction(
                db=db,
                user_id=user.id,
                reference=str(tx_ref_uuid),
                status="failed",
                title="Deposit failed",
                message=(
                    f"Your deposit of {deposit_data.currency} "
                    f"{deposit_data.local_amount} could not be started."
                ),
                entity_url="/dashboard/wallet/fund",
            )
            raise

        if not init_payment_response["status"]:
            await NotificationService.notify_transaction(
                db=db,
                user_id=user.id,
                reference=str(tx_ref_uuid),
                status="failed",
                title="Deposit failed",
                message=(
                    f"Your deposit of {deposit_data.currency} "
                    f"{deposit_data.local_amount} was rejected by the payment provider."
                ),
                entity_url="/dashboard/wallet/fund",
            )
            raise HTTPException(
                status_code=400, detail=init_payment_response["message"]
            )
        wallet = await WalletService.get_wallet(db, user, redis_client)

        ledger_data = WalletLedgerCreate(
            wallet_id=wallet.id,
            type=LedgerType.deposit,
            local_amount=Decimal(deposit_data.local_amount),
            stable_amount=Decimal(deposit_data.local_amount)
            * MOCK_LOCAL_TO_STABLE_RATE,
            stable_currency=StableCurrency.usdc,
            local_currency=deposit_data.currency,
            exchange_rate=MOCK_LOCAL_TO_STABLE_RATE,
            reference=str(tx_ref_uuid),
            status=LedgerStatus.initiated,
            gateway=payment_gateway,
            note="Deposit initiated from API",
        )
        await WalletService.record_ledger_entry(ledger_data, db)
    elif payment_gateway == "cashramp":
        init_payment_response = await PaymentService.pay_with_cashramp(
            str(uuid.uuid4), Decimal(deposit_data.local_amount)
        )
    elif payment_gateway == "on_chain_solana":
        # Implement Solana payment logic here
        init_payment_response = await PaymentService.pay_with_solana(
            str(uuid.uuid4), Decimal(deposit_data.local_amount)
        )
    elif payment_gateway == "coopwise_network_on_solana":
        # Implement Coopwise network on Solana logic here
        init_payment_response = await PaymentService.pay_with_coopwise_network(
            str(uuid.uuid4), Decimal(deposit_data.local_amount)
        )
    elif payment_gateway == "mock_success":
        if config.ENV != "development" and datetime.now() > CUTOFF_DATE:
            raise HTTPException(
                status_code=400,
                detail=f"Mock payment is only available in production till {CUTOFF_DATE}.",
            )
        logger.info("\nMocking successful deposit payment \n")
        init_payment_response = {
            "status": True,
            "message": "Deposit successful",
            "data": {"amount": deposit_data.local_amount, "tx_ref": str(tx_ref_uuid)},
        }

        wallet = await WalletService.get_wallet(db, user, redis_client)

        ledger_data = WalletLedgerCreate(
            wallet_id=wallet.id,
            type=LedgerType.deposit,
            local_amount=Decimal(deposit_data.local_amount),
            stable_amount=Decimal(deposit_data.local_amount)
            * MOCK_LOCAL_TO_STABLE_RATE,
            stable_currency=StableCurrency.usdc,
            local_currency=deposit_data.currency,
            exchange_rate=MOCK_LOCAL_TO_STABLE_RATE,
            reference=str(tx_ref_uuid),
            status=LedgerStatus.initiated,
            gateway="cash",
            note="Deposit mocked from API",
        )
        await WalletService.record_ledger_entry(ledger_data, db)
    elif payment_gateway == "mock_fail":
        if config.ENV != "development" and datetime.now() > CUTOFF_DATE:
            raise HTTPException(
                status_code=400,
                detail="Mock payment is only available in production till 30th of June.",
            )
        logger.info("\nMocking successful deposit payment \n")
        init_payment_response = {
            "status": False,
            "message": "Payment failed",
            "data": {"amount": deposit_data.local_amount},
        }
        await NotificationService.notify_transaction(
            db=db,
            user_id=user.id,
            reference=str(tx_ref_uuid),
            status="failed",
            title="Deposit failed",
            message=(
                f"Your deposit of {deposit_data.currency} "
                f"{deposit_data.local_amount} could not be started."
            ),
            entity_url="/dashboard/wallet/fund",
        )
        raise HTTPException(status_code=400, detail=f"{init_payment_response}")
    else:
        raise HTTPException(status_code=400, detail="Unsupported payment gateway.")

    # Send user notification about deposit initiation
    noti_data = NotificationCreate(
        user_id=user.id,
        title="Deposit initiated",
        message=f"You have attempted a deposit of {deposit_data.currency} {deposit_data.local_amount} into your Coopwise wallet through {payment_gateway}",
        event_type="transaction",
        type="info",
        entity_url="/dashboard/wallet/fund",
    )
    await NotificationService.create_and_push_notification_to_user(noti_data, db)

    return {
        "payment_gateway": payment_gateway,
        "init_payment_response": init_payment_response,
    }


@router.post(
    "/deposit/finalise",
    summary="Finalise deposit by verifying transaction with reference",
)
async def finalise_deposit(
    reference: str,
    payment_gateway: str,
    db: AsyncSession = Depends(get_async_db_session),
    user: AuthenticatedUser = Depends(get_current_user),
    redis: Redis = Depends(get_redis),
):

    supported_gateways = [  # PaymentGateway.__members__
        "mock_success",
        "mock_fail",
        "paystack",
        "flutterwave",
        "cashramp",
        "on_chain_solana",
        "on_chain_cashramp" "coopwise_network_on_solana",
        "cash",
        "ussd",
        "bank_transfer",
        "crypo_wallet",
    ]

    if payment_gateway not in supported_gateways:
        raise HTTPException(status_code=400, detail="Unsupported payment method.")

    verification_result = False
    ledger_record = None

    # --- Gateway-Specific Verification Logic
    if payment_gateway == "mock_success":
        verification_result = True
        ledger_record = await WalletService.get_wallet_ledger_by_reference(
            reference, db
        )
    elif payment_gateway == "mock_fail":
        verification_result = False
    elif payment_gateway == "paystack":
        from src.domains.payments.service import PaymentService

        verification = await PaymentService.verify_paystack_transaction(reference)
        verification_result = (
            bool(verification.get("status"))
            and verification.get("data", {}).get("status") == "success"
        )
    elif payment_gateway == "cashramp":
        raise HTTPException(
            status_code=501, detail="Cashramp verification not yet implemented."
        )
    elif payment_gateway == "on_chain_cashramp":
        raise HTTPException(
            status_code=501,
            detail="On-chain Cashramp verification not yet implemented.",
        )
    elif payment_gateway == "coopwise_network_on_solana":
        raise HTTPException(
            status_code=501, detail="Coopwise Network on Solana not yet implemented."
        )

    if not verification_result:
        ledger_record = (
            ledger_record
            or await WalletService.get_wallet_ledger_by_reference(reference, db)
        )
        if ledger_record:
            await WalletService.fail_deposit(reference, db)
            wallet = await WalletService.get_wallet_by_id(
                str(ledger_record.wallet_id), db
            )
            if wallet:
                gateway_status = (
                    "abandoned" if payment_gateway == "paystack" else "failed"
                )
                await NotificationService.notify_transaction(
                    db=db,
                    user_id=wallet.user_id,
                    reference=reference,
                    status=gateway_status,
                    title=(
                        "Deposit abandoned"
                        if gateway_status == "abandoned"
                        else "Deposit failed"
                    ),
                    message=(
                        "Your deposit checkout was abandoned before completion."
                        if gateway_status == "abandoned"
                        else "Your deposit could not be verified. No funds were added to your wallet."
                    ),
                    entity_url="/dashboard/wallet/fund",
                )
        else:
            await NotificationService.notify_transaction(
                db=db,
                user_id=user.id,
                reference=reference,
                status="failed",
                title="Deposit failed",
                message="Your deposit could not be verified. No funds were added to your wallet.",
                entity_url="/dashboard/wallet/fund",
            )
        raise HTTPException(status_code=400, detail="Transaction verification failed.")

    if not ledger_record:
        ledger_record = await WalletService.get_wallet_ledger_by_reference(
            reference, db
        )

    if ledger_record.status not in [LedgerStatus.initiated, LedgerStatus.pending]:
        raise HTTPException(
            status_code=400, detail="Transaction already processed or invalid."
        )

    logger.info(
        f"\n Payment verified for reference: {reference} by {payment_gateway}. Settling into wallet...\n"
    )

    # Settle the payment ledger into the user's wallet
    updated_wallet = await WalletService.settle_payment_ledger_into_wallet(
        ledger_record.id, db, redis
    )

    await NotificationService.notify_transaction(
        db=db,
        user_id=updated_wallet.user_id,
        reference=reference,
        status="succeeded",
        title="Deposit successful",
        message=(
            f"Your deposit of {ledger_record.local_currency.value} "
            f"{ledger_record.local_amount} was completed successfully."
        ),
        entity_url="/dashboard/wallet/fund",
    )

    logger.info(
        f"[Deposit finalised] payment ledge settled into wallet {updated_wallet}"
    )

    return {
        "message": "Deposit finalised successfully.",
        "receipt": {
            "ledger_id": ledger_record.id,
            "amount": ledger_record.stable_amount,
            "status": "settled",
            "reference": ledger_record.reference,
        },
    }


@router.post("/withdraw", response_model=WalletWithdrawalDetail)
async def withdraw_to_bank(
    payload: WalletWithdraw,
    db: AsyncSession = Depends(get_async_db_session),
    user: AuthenticatedUser = Depends(get_current_user),
):
    """Reserve wallet funds and send them to the member's verified bank account."""
    result = await db.execute(
        select(KYCVerification)
        .options(selectinload(KYCVerification.banking_info))
        .where(KYCVerification.user_id == user.id)
    )
    kyc = result.scalar_one_or_none()
    banking = kyc.banking_info if kyc else None
    if (
        not kyc
        or kyc.status != KYCStatus.verified
        or not banking
        or not banking.provider_verified
    ):
        if not kyc:
            detail = {
                "code": "kyc_required",
                "message": "Complete KYC and add a verified bank account before withdrawing.",
                "kyc_status": "not_started",
            }
        elif kyc.status != KYCStatus.verified:
            detail = {
                "code": "kyc_pending_review",
                "message": "Your KYC is still under review. Withdrawals will be enabled after it is verified.",
                "kyc_status": kyc.status.value,
            }
        elif not banking:
            detail = {
                "code": "bank_account_required",
                "message": "Add a bank account before withdrawing.",
                "kyc_status": kyc.status.value,
            }
        else:
            detail = {
                "code": "bank_account_unverified",
                "message": "Your bank account could not be verified. Update your banking details before withdrawing.",
                "kyc_status": kyc.status.value,
            }
        raise HTTPException(
            status_code=400,
            detail=detail,
        )

    withdrawal = await WalletService.reserve_withdrawal(
        user.id, payload.local_amount, db
    )
    encryptor = FieldEncryptor(config.SECRET_ENCRYPTION_KEY)
    account_number = encryptor.decrypt(banking.account_number_encrypted)
    provider_reference = f"withdrawal-{withdrawal.id}-{uuid.uuid4().hex[:8]}"

    try:
        recipient_code = await PaymentService.create_paystack_transfer_recipient(
            account_number=account_number,
            bank_code=banking.bank_code,
            account_name=banking.account_name,
        )
        withdrawal = await WalletService.set_withdrawal_provider(
            withdrawal_id=withdrawal.id,
            recipient_code=recipient_code,
            provider_reference=provider_reference,
            bank_name=banking.bank_name,
            bank_code=banking.bank_code,
            account_number_last4=banking.account_number_last4,
            db=db,
        )
        transfer = await PaymentService.initiate_paystack_transfer(
            amount=payload.local_amount,
            recipient_code=recipient_code,
            reference=provider_reference,
            reason="CoopWise wallet withdrawal",
        )
        returned_reference = transfer.get("reference", provider_reference)
        if returned_reference != provider_reference:
            withdrawal = await WalletService.set_withdrawal_provider(
                withdrawal_id=withdrawal.id,
                recipient_code=recipient_code,
                provider_reference=returned_reference,
                bank_name=banking.bank_name,
                bank_code=banking.bank_code,
                account_number_last4=banking.account_number_last4,
                db=db,
            )
    except Exception as exc:
        withdrawal = await WalletService.mark_withdrawal_from_provider(
            withdrawal,
            success=False,
            reversed=False,
            reason=str(getattr(exc, "detail", exc)),
            db=db,
        )
        await NotificationService.notify_transaction(
            db=db,
            user_id=user.id,
            reference=withdrawal.reference,
            status="failed",
            title="Withdrawal failed",
            message="Your bank withdrawal failed and the funds were returned to your wallet.",
            entity_url="/dashboard/wallet/fund",
        )
        provider_detail = str(getattr(exc, "detail", exc))
        if "third party payouts as a starter business" in provider_detail.lower():
            raise HTTPException(
                status_code=503,
                detail={
                    "code": "paystack_transfers_unavailable",
                    "message": (
                        "Bank withdrawals are unavailable because this Paystack account "
                        "is a Starter Business. Upgrade it to a Registered Business "
                        "to enable Transfers. Your wallet funds were returned."
                    ),
                },
            )
        if isinstance(exc, HTTPException):
            raise
        raise HTTPException(status_code=502, detail="Could not start bank withdrawal")

    await NotificationService.notify_transaction(
        db=db,
        user_id=user.id,
        reference=withdrawal.reference,
        status="initiated",
        title="Withdrawal initiated",
        message=(
            f"Your withdrawal of {banking.bank_name} {payload.local_amount} "
            f"is being processed to account ending {banking.account_number_last4}."
        ),
        entity_url="/dashboard/wallet/fund",
    )
    return withdrawal


@router.get("/withdrawals", response_model=list[WalletWithdrawalDetail])
async def list_wallet_withdrawals(
    db: AsyncSession = Depends(get_async_db_session),
    user: AuthenticatedUser = Depends(get_current_user),
):
    return await WalletService.list_withdrawals(user.id, db)


@router.get("/get-wallet", response_model=WalletDetail)
async def get_wallet(
    db: AsyncSession = Depends(get_async_db_session),
    user: AuthenticatedUser = Depends(get_current_user),
    redis_client: Redis = Depends(get_redis),
):

    return await WalletService.get_wallet(db, user, redis_client)


@router.post("/withdraw")
async def withdraw(
    data: WalletWithdraw,
    db: AsyncSession = Depends(get_async_db_session),
    user: AuthenticatedUser = Depends(get_current_user),
    redis_client: Redis = Depends(get_redis),
):
    return await WalletService.withdraw(data, db, user, redis_client)
