import random
import secrets
from decimal import Decimal, ROUND_DOWN
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

        return await PayoutService._select_next_recipient(
            db, group_id, members, counts_by_user
        )

    @staticmethod
    async def get_payable_amount(db: AsyncSession, group_id: UUID) -> Decimal:
        """
        Cooperative wallet: completed contributions add to it, and payouts
        that are pending, transferring, or completed take from it.
        A failed payout is not subtracted, so that money stays in the coop.
        """
        contributed = await db.execute(
            select(func.coalesce(func.sum(Contribution.amount), 0)).where(
                Contribution.group_id == group_id,
                Contribution.status == ContributionStatus.completed,
            )
        )
        paid_out = await db.execute(
            select(func.coalesce(func.sum(PayoutRecord.amount), 0)).where(
                PayoutRecord.group_id == group_id,
                PayoutRecord.status.in_(
                    [
                        PayoutStatus.pending,
                        PayoutStatus.processing,
                        PayoutStatus.completed,
                    ]
                ),
            )
        )
        balance = Decimal(contributed.scalar_one()) - Decimal(paid_out.scalar_one())
        return balance if balance > 0 else Decimal(0)

    @staticmethod
    def _enum_value(value) -> str | None:
        if value is None:
            return None
        return value.value if hasattr(value, "value") else str(value)

    @staticmethod
    async def _financial_rule(db: AsyncSession, group_id: UUID):
        from src.domains.cooperatives.exceptions import RuleNotFoundError
        from src.domains.cooperatives.services.rule_services import FinancialRuleService
        from src.domains.cooperatives.uow import UnitOfWork

        try:
            return await FinancialRuleService(UnitOfWork(db)).get_active(group_id)
        except RuleNotFoundError:
            return None

    @staticmethod
    async def _payout_decision(db: AsyncSession, group_id: UUID):
        from src.domains.cooperatives.exceptions import RuleNotFoundError
        from src.domains.cooperatives.services.rule_services import DecisionRuleService
        from src.domains.cooperatives.uow import UnitOfWork

        try:
            return await DecisionRuleService(UnitOfWork(db)).get_active(
                group_id, "payout_order"
            )
        except RuleNotFoundError:
            return None

    @staticmethod
    def _allows_automatic(rule, decision) -> bool:
        """Rotation and lottery pay themselves. Admin, vote, and AI wait for a trigger."""
        if rule is None:
            return False
        mechanism = PayoutService._enum_value(
            getattr(decision, "mechanism", None) if decision else None
        )
        if mechanism in ("admin", "vote", "ai_suggested"):
            return False
        return True

    @staticmethod
    async def _select_next_recipient(
        db: AsyncSession,
        group_id: UUID,
        members: List[GroupMembership],
        counts_by_user: Dict[Any, int],
    ) -> GroupMembership:
        rule = await PayoutService._financial_rule(db, group_id)
        decision = await PayoutService._payout_decision(db, group_id)
        min_count = min(counts_by_user.get(member.user_id, 0) for member in members)
        candidates = [
            member
            for member in members
            if counts_by_user.get(member.user_id, 0) == min_count
        ]

        strategy = PayoutService._enum_value(getattr(rule, "payout_strategy", None))
        rotation = PayoutService._enum_value(getattr(rule, "rotation_order", None))
        mechanism = PayoutService._enum_value(
            getattr(decision, "mechanism", None) if decision else None
        )

        if mechanism == "lottery" or (strategy == "rotating" and rotation == "random"):
            return random.choice(candidates)

        if strategy == "priority":
            totals = await PayoutService._contribution_totals(
                db, group_id, [member.user_id for member in candidates]
            )
            order = {member.user_id: index for index, member in enumerate(candidates)}
            return max(
                candidates,
                key=lambda member: (
                    totals.get(member.user_id, Decimal(0)),
                    -order[member.user_id],
                ),
            )

        return candidates[0]

    @staticmethod
    async def _contribution_totals(
        db: AsyncSession, group_id: UUID, user_ids: List[UUID]
    ) -> Dict[UUID, Decimal]:
        if not user_ids:
            return {}
        rows = await db.execute(
            select(
                Contribution.user_id, func.coalesce(func.sum(Contribution.amount), 0)
            )
            .where(
                Contribution.group_id == group_id,
                Contribution.user_id.in_(user_ids),
                Contribution.status == ContributionStatus.completed,
            )
            .group_by(Contribution.user_id)
        )
        return {user_id: Decimal(total) for user_id, total in rows.all()}

    @staticmethod
    async def _has_inflight(db: AsyncSession, group_id: UUID) -> bool:
        inflight = await db.execute(
            select(func.count(PayoutRecord.id)).where(
                PayoutRecord.group_id == group_id,
                PayoutRecord.status.in_(
                    [PayoutStatus.pending, PayoutStatus.processing]
                ),
            )
        )
        return inflight.scalar_one() > 0

    @staticmethod
    async def _round_is_funded(db: AsyncSession, group_id: UUID, rule, members) -> bool:
        if rule is None or not members:
            return False
        target = Decimal(str(rule.contribution_amount or 0)) * len(members)
        if target <= 0:
            return False
        available = await PayoutService.get_payable_amount(db, group_id)
        return available >= target

    @staticmethod
    async def dispatch_payout(
        db: AsyncSession, group_id: UUID, *, automatic: bool
    ) -> List[PayoutRecord]:
        """
        Pay the next turn, or every member an equal share, using the
        cooperative's financial rule and payout-order decision.

        Automatic runs only for rotation and lottery (or when no decision
        rule overrides them) and only once the round's contributions are in.
        Admin, vote, and AI-suggested payouts wait for an explicit trigger.
        """
        rule = await PayoutService._financial_rule(db, group_id)
        decision = await PayoutService._payout_decision(db, group_id)
        if automatic:
            if not PayoutService._allows_automatic(rule, decision):
                return []
            if await PayoutService._has_inflight(db, group_id):
                return []
            members = await PayoutService._active_members_in_join_order(db, group_id)
            if not await PayoutService._round_is_funded(db, group_id, rule, members):
                return []

        strategy = PayoutService._enum_value(getattr(rule, "payout_strategy", None))
        currency = PayoutService._enum_value(getattr(rule, "currency", None)) or "NGN"
        try:
            if strategy == "equal":
                return await PayoutService._execute_equal_split(
                    db, group_id, currency=currency
                )
            return [await PayoutService.execute_payout(db, group_id, currency=currency)]
        except PayoutError:
            if automatic:
                logger.info("Automatic payout skipped for group %s", group_id)
                return []
            raise

    @staticmethod
    async def _execute_equal_split(
        db: AsyncSession, group_id: UUID, currency: str = "NGN"
    ) -> List[PayoutRecord]:
        group = await db.get(CoopCooperative, group_id)
        if not group:
            raise PayoutError("Group not found")
        if group.status != "active":
            raise PayoutError("Group is not active")

        members = await PayoutService._active_members_in_join_order(db, group_id)
        if len(members) < 2:
            raise PayoutError("Minimum 2 active members required for payouts")

        amount = await PayoutService.get_payable_amount(db, group_id)
        if amount <= 0:
            raise PayoutError("No funds available to pay out")

        share = (amount / len(members)).quantize(Decimal("0.01"), rounding=ROUND_DOWN)
        if share <= 0:
            raise PayoutError("No funds available to pay out")

        round_number = await PayoutService.get_current_round(db, group_id)
        paid: List[PayoutRecord] = []
        allocated = Decimal(0)
        for index, member in enumerate(members):
            member_share = amount - allocated if index == len(members) - 1 else share
            allocated += member_share
            try:
                paid.append(
                    await PayoutService._disburse(
                        db,
                        group,
                        member.user_id,
                        member_share,
                        round_number,
                        currency,
                    )
                )
            except PayoutError as exc:
                logger.info(
                    "Skipping equal-split payout for user %s: %s",
                    member.user_id,
                    exc,
                )
        if not paid:
            raise PayoutError("No member has completed verified bank-account KYC")
        return paid

    @staticmethod
    async def list_for_user(db: AsyncSession, user_id: UUID, limit: int = 20):
        rows = await db.execute(
            select(PayoutRecord, CoopCooperative.name)
            .join(CoopCooperative, CoopCooperative.id == PayoutRecord.group_id)
            .where(PayoutRecord.user_id == user_id)
            .order_by(PayoutRecord.created_at.desc())
            .limit(limit)
        )
        return [
            {
                "id": record.id,
                "group_id": record.group_id,
                "group_name": name,
                "round_number": record.round_number,
                "amount": record.amount,
                "currency": record.currency,
                "status": record.status,
                "failure_reason": record.failure_reason,
                "created_at": record.created_at,
                "completed_at": record.completed_at,
            }
            for record, name in rows.all()
        ]

    @staticmethod
    async def list_upcoming_for_user(db: AsyncSession, user_id: UUID):
        from src.domains.users.models import User

        memberships = await db.execute(
            select(GroupMembership, CoopCooperative)
            .join(CoopCooperative, CoopCooperative.id == GroupMembership.group_id)
            .where(
                GroupMembership.user_id == user_id,
                GroupMembership.status == "active",
                CoopCooperative.status == "active",
            )
            .order_by(CoopCooperative.name.asc())
        )
        items = []
        for membership, group in memberships.all():
            rule = await PayoutService._financial_rule(db, group.id)
            decision = await PayoutService._payout_decision(db, group.id)
            members = await PayoutService._active_members_in_join_order(db, group.id)
            recipient = await PayoutService.get_next_recipient(db, group.id)
            payable = await PayoutService.get_payable_amount(db, group.id)
            inflight = await PayoutService._has_inflight(db, group.id)
            automatic = PayoutService._allows_automatic(rule, decision)
            funded = await PayoutService._round_is_funded(db, group.id, rule, members)
            strategy = (
                PayoutService._enum_value(getattr(rule, "payout_strategy", None))
                or "rotating"
            )
            role = PayoutService._enum_value(membership.role)
            is_admin = role == "admin"
            is_my_turn = strategy == "equal" or (
                recipient is not None and recipient.user_id == user_id
            )
            names = {}
            if recipient is not None:
                user = await db.get(User, recipient.user_id)
                if user is not None:
                    names[recipient.user_id] = user.full_name
            show_amount = is_admin or is_my_turn
            can_trigger = (
                is_admin
                and not inflight
                and payable > 0
                and len(members) >= 2
                and (not automatic or funded)
            )
            items.append(
                {
                    "group_id": group.id,
                    "group_name": group.name,
                    "strategy": strategy,
                    "trigger": "automatic" if automatic else "admin",
                    "is_my_turn": is_my_turn,
                    "next_recipient_name": (
                        names.get(recipient.user_id) if recipient else None
                    ),
                    "payable_amount": float(payable) if show_amount else None,
                    "currency": PayoutService._enum_value(
                        getattr(rule, "currency", None)
                    )
                    or "NGN",
                    "round_number": await PayoutService.get_current_round(db, group.id),
                    "funded": funded,
                    "inflight": inflight,
                    "can_trigger": can_trigger,
                }
            )
        return items

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

        round_number = await PayoutService.get_current_round(db, group_id)
        return await PayoutService._disburse(
            db, group, recipient.user_id, amount, round_number, currency
        )

    @staticmethod
    async def _disburse(
        db: AsyncSession,
        group: CoopCooperative,
        user_id: UUID,
        amount: Decimal,
        round_number: int,
        currency: str,
    ) -> PayoutRecord:
        kyc = await db.execute(
            select(KYCVerification).where(KYCVerification.user_id == user_id)
        )
        kyc_verification = kyc.scalars().first()
        banking_info = kyc_verification.banking_info if kyc_verification else None
        if not banking_info or not banking_info.provider_verified:
            raise PayoutError("Recipient has not completed verified bank-account KYC")

        payout_record = PayoutRecord(
            group_id=group.id,
            user_id=user_id,
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
