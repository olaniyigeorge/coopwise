import secrets
from decimal import Decimal
import requests
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status

from src.domains.auth.schemas import AuthenticatedUser

from src.domains.wallets.schemas import WalletLedgerCreate
from src.domains.wallets.service import MOCK_LOCAL_TO_STABLE_RATE, WalletService
from src.domains.wallets.models import LocalCurrency
from config import AppConfig as config
from src.domains.payments.schemas import ChargeResponse, PaystackPayload
from src.shared.utils.logger import logger

# --------------------
from typing import Optional, Dict, Any, List
from datetime import datetime
from uuid import UUID

from sqlalchemy import func

from src.domains.cooperatives.models.cooperative import CoopCooperative
from src.domains.contributions.models import Contribution, ContributionStatus
from src.domains.memberships.models.group_membership import GroupMembership
from src.domains.payments.models import PayoutRecord, PayoutStatus
from src.domains.kyc.models import KYCVerification
from src.infra.security.field_encryptor import FieldEncryptor


# One rate for the whole wallet: deposits, withdrawals and contributions must
# all convert with the same constant or balances drift on a round trip.
COOPWISE_USD_NGN_RATE = MOCK_LOCAL_TO_STABLE_RATE


class PaymentService:

    @staticmethod
    async def init_pay_with_paystack(
        payload: PaystackPayload,
        channels: Optional[List[str]] = ("bank_transfer",),
        extra_metadata: Optional[Dict[str, Any]] = None,
    ) -> ChargeResponse | None:
        """
        Make a payment through paystack.

        `channels` defaults to bank transfer only (wallet deposits). Pass None
        to let Paystack offer every channel enabled on the merchant dashboard
        (card, bank, USSD, ...), e.g. for direct contribution payments.
        """
        # Simulate a payment request to Paystack
        logger.info(f"\n\n\n\nProcessing payment with Paystack: {payload}\n\n")

        try:
            url = "https://api.paystack.co/transaction/initialize"

            # datum = {
            #     "amount": payload.amount,
            #     "email": payload.email,
            #     "currency": payload.currency or "NGN",
            #     "tx_ref": payload.tx_ref or "CP-WS-000000000000",
            #     "fullname": payload.fullname or "John Doe",
            #     "phone_number": payload.phone_number or "08012345678",
            #     "client_ip": payload.client_ip or "154.123.220.1",
            #     "device_fingerprint": payload.device_fingerprint or "0000000000",
            #     "meta": {
            #         "flightID": payload.tx_ref or "0000000",
            #         "sideNote": getattr(
            #             payload.meta, "note", "Payment on Coopwise through API v1"
            #         ),
            #     },
            #     "is_permanent": False,
            # }

            data = {
                "email": payload.email,
                "amount": payload.amount,
                "reference": payload.tx_ref,
                "callback_url": f"{config.DOMAIN}/api/v1/payments/paystack/callback",
                "metadata": {
                    "currency": f"{payload.currency}",
                    "sideNote": getattr(
                        payload.meta, "note", "Payment on Coopwise through API v1"
                    ),
                    **(extra_metadata or {}),
                },
            }
            if channels:
                data["channels"] = list(channels)
            headers = {
                "accept": "application/json",
                "Authorization": f"Bearer {config.PAYSTACK_SECRET_KEY}",  # FLWSECK_TEST-SANDBOXDEMOKEY-X
                "Content-Type": "application/json",
            }

            response = requests.post(url, json=data, headers=headers)
        except Exception as e:
            logger.error(f"Error processing payment with Paystack: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Payment processing failed",
            )
        logger.debug(f"\n\n{response.text}\n\n")

        # res : ChargeResponse = response.json()
        res = response.json()
        return res

    @staticmethod
    async def init_pay_with_flutterwave(
        payload: PaystackPayload,
    ) -> ChargeResponse | None:
        """
        Make a payment through Flutterwave
        """
        # Simulate a payment request to Flutterwave
        logger.info(f"\n\n\n\nProcessing payment with Flutterwave: {payload}\n\n")

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
                "device_fingerprint": payload.device_fingerprint
                or "62wd23423rq324323qew1",
                "meta": {
                    "flightID": payload.tx_ref or "123949494DC",
                    "sideNote": getattr(
                        payload.meta, "note", "Payment on Coopwise through API v1"
                    ),
                },
                "is_permanent": False,
            }
            headers = {
                "accept": "application/json",
                "Authorization": f"Bearer {config.PAYSTACK_SECRET_KEY}",  # FLWSECK_TEST-SANDBOXDEMOKEY-X
                "Content-Type": "application/json",
            }

            response = requests.post(url, json=data, headers=headers)
        except Exception as e:
            logger.error(f"Error processing payment with Flutterwave: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Payment processing failed",
            )
        logger.debug(f"\n\n{response.text}\n\n")

        res: ChargeResponse = response.json()

        return res

    @staticmethod
    async def init_pay_with_paystack_and_record(
        db: AsyncSession, user: AuthenticatedUser, payload: PaystackPayload
    ) -> ChargeResponse | None:
        await PaymentService.init_pay_with_paystack(payload)

        ledger_create = WalletLedgerCreate(
            wallet_id=user.id,
            type="deposit",
            stable_amount=(payload.amount * COOPWISE_USD_NGN_RATE),
            local_amount=payload.amount,
            local_currency="NGN",
            exchange_rate=COOPWISE_USD_NGN_RATE,
            status="initiated",
        )
        ledger = await WalletService.record_ledger_entry(ledger_create, db)

        return ledger

    # @staticmethod
    # async def init_pay_with_paystack(payload: PaystackPayload) -> dict:
    #     """
    #     Initialize Paystack transaction and return authorization URL.
    #     """
    #     url = "https://api.paystack.co/transaction/initialize"

    #     data = {
    #         "email": payload.email,
    #         "amount": payload.amount,
    #         "callback_url": payload.callback_url,
    #         "metadata": {
    #             "custom_fields": [
    #                 {
    #                     "display_name": "Customer Name",
    #                     "variable_name": "customer_name",
    #                     "value": payload.fullname
    #                 },
    #                 {
    #                     "display_name": "Phone Number",
    #                     "variable_name": "phone_number",
    #                     "value": payload.phone_number
    #                 },
    #                 {
    #                     "display_name": "User ID",
    #                     "variable_name": "user_id",
    #                     "value": payload.meta.get("user_id")
    #                 }
    #             ],
    #             **payload.meta
    #         },
    #         "reference": payload.tx_ref
    #     }

    #     headers = {
    #         "Authorization": f"Bearer {config.PAYSTACK_SECRET_KEY}",
    #         "Content-Type": "application/json"
    #     }

    #     try:
    #         response = requests.post(url, json=data, headers=headers)
    #         result = response.json()

    #         if not result.get("status"):
    #             raise HTTPException(
    #                 status_code=status.HTTP_400_BAD_REQUEST,
    #                 detail=result.get("message", "Failed to initiate Paystack transaction")
    #             )

    #         return result
    #     except Exception as e:
    #         logger.error(f"Paystack init error: {e}")
    #         raise HTTPException(
    #             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
    #             detail="Could not initialize Paystack transaction"
    #         )

    @staticmethod
    async def verify_paystack_transaction(reference: str) -> dict:
        """
        Verify transaction status from Paystack.
        """
        url = f"https://api.paystack.co/transaction/verify/{reference}"

        headers = {
            "Authorization": f"Bearer {config.PAYSTACK_SECRET_KEY}",
            "Content-Type": "application/json",
        }

        try:
            response = requests.get(url, headers=headers)
            result = response.json()

            if not result.get("status"):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=result.get(
                        "message", "Failed to verify Paystack transaction"
                    ),
                )

            logger.info(f"\n{result}\n")
            return result
        except HTTPException:
            # The precise 400 raised above for a Paystack-reported failure —
            # don't let the blanket handler below flatten it into a 500.
            raise
        except Exception as e:
            logger.error(f"Paystack verification error: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not verify Paystack transaction",
            )

    @staticmethod
    async def pay_with_cashramp(
        amount: Decimal,
        currency: LocalCurrency,
        customer_id: str,
        payment_type: str,  # "deposit" | "withdraw",
        payment_method_type: str,  #  "bank_transfer_ng" | "kuda_pay" # Dynamic from CashrampGraphQL
        reference: str,
        proof_of_payment: str,  # Flag from proof of payment like receipt_url, agent_decision, network_activity etc
    ):
        # Out of scope for the Web2 MVP (Paystack is the chosen fiat rail).
        # CashRampService requires a Redis-backed transport to construct
        # (see src/infra/payments/cashramp_service.py) and isn't wired via DI
        # here — build that out if/when Cashramp becomes the active rail.
        raise NotImplementedError(
            "Cashramp payment rail is not wired up. Use Paystack (deposit-with-paystack "
            "/ PayoutService) for the current MVP."
        )

    @staticmethod
    async def confirm_payment(db: AsyncSession, user_id: str):
        """
        Confirm the payment
        """
        pass

    @staticmethod
    async def pay_with_solana():
        raise NotImplementedError("Solana rail is Web3-layer, deferred past MVP.")

    @staticmethod
    async def pay_with_coopwise_network():
        raise NotImplementedError(
            "CoopWise network rail is Web3-layer, deferred past MVP."
        )

    @staticmethod
    async def create_paystack_transfer_recipient(
        account_number: str, bank_code: str, account_name: str
    ) -> str:
        """Create (or reuse) a Paystack transfer recipient, returns recipient_code."""
        url = "https://api.paystack.co/transferrecipient"
        headers = {
            "Authorization": f"Bearer {config.PAYSTACK_SECRET_KEY}",
            "Content-Type": "application/json",
        }
        data = {
            "type": "nuban",
            "name": account_name,
            "account_number": account_number,
            "bank_code": bank_code,
            "currency": "NGN",
        }
        try:
            response = requests.post(url, json=data, headers=headers)
            result = response.json()
        except Exception as e:
            logger.error(f"Paystack recipient creation error: {e}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Could not create payout recipient",
            )

        if not result.get("status"):
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=result.get("message", "Failed to create payout recipient"),
            )

        return result["data"]["recipient_code"]

    @staticmethod
    async def initiate_paystack_transfer(
        amount: Decimal, recipient_code: str, reference: str, reason: str
    ) -> dict:
        """Initiate a Paystack transfer (kobo amount), returns the transfer payload."""
        url = "https://api.paystack.co/transfer"
        headers = {
            "Authorization": f"Bearer {config.PAYSTACK_SECRET_KEY}",
            "Content-Type": "application/json",
        }
        data = {
            "source": "balance",
            "amount": int(amount * 100),  # kobo
            "recipient": recipient_code,
            "reference": reference,
            "reason": reason,
        }
        try:
            response = requests.post(url, json=data, headers=headers)
            result = response.json()
        except Exception as e:
            logger.error(f"Paystack transfer error: {e}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Could not initiate payout transfer",
            )

        if not result.get("status"):
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=result.get("message", "Failed to initiate payout transfer"),
            )

        return result["data"]


"""
Payout Service (fiat rail)

Executes fiat payouts to cooperative group members via Paystack transfer,
with PayoutRecord as the source of truth for history and rotation state.
The prior implementation here was blockchain-only, called a mocked
contract layer, and was never wired to any router — replaced outright
rather than adapted, since none of it was reachable via the API.

Rotation Logic:
- Round-robin over active members by join order: whoever has received
  the fewest completed payouts goes next (ties broken by earliest join).
- A round is "complete" once every active member has received one payout;
  get_current_round reports which round is in progress.

Payout amount:
- Sum of completed contributions received since the group's last
  completed payout (or since group creation, for the first payout).
"""


class PayoutError(Exception):
    """Raised for payout preconditions that fail before contacting Paystack."""


class PayoutService:
    @staticmethod
    async def _active_members_in_join_order(
        db: AsyncSession, group_id: UUID
    ) -> List[GroupMembership]:
        result = await db.execute(
            select(GroupMembership)
            .where(
                GroupMembership.group_id == group_id,
                GroupMembership.status == "active",
            )
            .order_by(GroupMembership.joined_at.asc(), GroupMembership.created_at.asc())
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_current_round(db: AsyncSession, group_id: UUID) -> int:
        completed = await db.execute(
            select(func.count(PayoutRecord.id)).where(
                PayoutRecord.group_id == group_id,
                PayoutRecord.status == PayoutStatus.completed,
            )
        )
        members = await PayoutService._active_members_in_join_order(db, group_id)
        if not members:
            return 1
        return (completed.scalar_one() // len(members)) + 1

    @staticmethod
    async def get_next_recipient(
        db: AsyncSession, group_id: UUID
    ) -> Optional[GroupMembership]:
        members = await PayoutService._active_members_in_join_order(db, group_id)
        if not members:
            return None

        payout_counts = await db.execute(
            select(PayoutRecord.user_id, func.count(PayoutRecord.id))
            .where(
                PayoutRecord.group_id == group_id,
                PayoutRecord.status == PayoutStatus.completed,
            )
            .group_by(PayoutRecord.user_id)
        )
        counts_by_user = dict(payout_counts.all())

        return min(members, key=lambda m: counts_by_user.get(m.user_id, 0))

    @staticmethod
    async def get_payable_amount(db: AsyncSession, group_id: UUID) -> Decimal:
        last_payout = await db.execute(
            select(PayoutRecord.completed_at)
            .where(
                PayoutRecord.group_id == group_id,
                PayoutRecord.status == PayoutStatus.completed,
            )
            .order_by(PayoutRecord.completed_at.desc())
            .limit(1)
        )
        since = last_payout.scalar_one_or_none()
        if since is None:
            group = await db.get(CoopCooperative, group_id)
            since = group.created_at if group else None

        query = select(func.coalesce(func.sum(Contribution.amount), 0)).where(
            Contribution.group_id == group_id,
            Contribution.status == ContributionStatus.completed,
        )
        if since is not None:
            query = query.where(Contribution.fulfilled_at > since)

        result = await db.execute(query)
        return Decimal(result.scalar_one())

    @staticmethod
    async def check_payout_readiness(
        db: AsyncSession, group_id: UUID
    ) -> Dict[str, Any]:
        group = await db.get(CoopCooperative, group_id)
        if not group:
            return {"is_ready": False, "error": "Group not found"}

        recipient = await PayoutService.get_next_recipient(db, group_id)
        amount = await PayoutService.get_payable_amount(db, group_id)

        return {
            "is_ready": recipient is not None and amount > 0,
            "next_recipient_user_id": str(recipient.user_id) if recipient else None,
            "payable_amount": float(amount),
            "current_round": await PayoutService.get_current_round(db, group_id),
            "group_id": str(group_id),
        }

    @staticmethod
    async def execute_payout(
        db: AsyncSession, group_id: UUID, currency: str = "NGN"
    ) -> PayoutRecord:
        """
        Execute the next fiat payout for a group.

        Raises PayoutError for precondition failures (not ready, no verified
        bank details, etc). Paystack-side failures are recorded on the
        PayoutRecord (status=failed) rather than raised, so the caller gets
        a durable audit trail either way.
        """
        group = await db.get(CoopCooperative, group_id)
        if not group:
            raise PayoutError("Group not found")
        if group.status != "active":
            raise PayoutError("Group is not active")

        members = await PayoutService._active_members_in_join_order(db, group_id)
        if len(members) < 2:
            raise PayoutError("Minimum 2 active members required for payouts")

        recipient = await PayoutService.get_next_recipient(db, group_id)
        if not recipient:
            raise PayoutError("No eligible recipient found")

        amount = await PayoutService.get_payable_amount(db, group_id)
        if amount <= 0:
            raise PayoutError("No funds available to pay out")

        kyc = await db.execute(
            select(KYCVerification).where(KYCVerification.user_id == recipient.user_id)
        )
        kyc_verification = kyc.scalars().first()
        banking_info = kyc_verification.banking_info if kyc_verification else None
        if not banking_info or not banking_info.provider_verified:
            raise PayoutError("Recipient has not completed verified bank-account KYC")

        round_number = await PayoutService.get_current_round(db, group_id)

        payout_record = PayoutRecord(
            group_id=group_id,
            user_id=recipient.user_id,
            round_number=round_number,
            amount=amount,
            currency=currency,
            status=PayoutStatus.pending,
        )
        db.add(payout_record)
        await db.commit()
        await db.refresh(payout_record)

        encryptor = FieldEncryptor(config.SECRET_ENCRYPTION_KEY)
        account_number = encryptor.decrypt(banking_info.account_number_encrypted)

        try:
            recipient_code = await PaymentService.create_paystack_transfer_recipient(
                account_number=account_number,
                bank_code=banking_info.bank_code,
                account_name=banking_info.account_name,
            )
            reference = f"payout-{payout_record.id}-{secrets.token_hex(4)}"
            transfer = await PaymentService.initiate_paystack_transfer(
                amount=amount,
                recipient_code=recipient_code,
                reference=reference,
                reason=f"CoopWise payout — {group.name} (round {round_number})",
            )
            payout_record.recipient_code = recipient_code
            payout_record.provider_reference = transfer.get("reference", reference)
            payout_record.status = PayoutStatus.processing
        except HTTPException as e:
            payout_record.status = PayoutStatus.failed
            payout_record.failure_reason = str(e.detail)
            logger.error(f"Payout {payout_record.id} failed to initiate: {e.detail}")

        await db.commit()
        await db.refresh(payout_record)
        return payout_record

    @staticmethod
    async def mark_payout_from_webhook(
        db: AsyncSession,
        reference: str,
        success: bool,
        failure_reason: str | None = None,
    ) -> Optional[PayoutRecord]:
        result = await db.execute(
            select(PayoutRecord).where(PayoutRecord.provider_reference == reference)
        )
        payout_record = result.scalars().first()
        if not payout_record:
            return None

        payout_record.status = (
            PayoutStatus.completed if success else PayoutStatus.failed
        )
        if success:
            payout_record.completed_at = datetime.now()
        else:
            payout_record.failure_reason = failure_reason
        await db.commit()
        await db.refresh(payout_record)
        return payout_record

    @staticmethod
    async def get_payout_history(
        db: AsyncSession, group_id: UUID, limit: int = 10
    ) -> List[PayoutRecord]:
        result = await db.execute(
            select(PayoutRecord)
            .where(PayoutRecord.group_id == group_id)
            .order_by(PayoutRecord.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_payouts_for_user(
        db: AsyncSession, user_id: UUID, limit: int = 20
    ) -> List[PayoutRecord]:
        result = await db.execute(
            select(PayoutRecord)
            .where(PayoutRecord.user_id == user_id)
            .order_by(PayoutRecord.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())
