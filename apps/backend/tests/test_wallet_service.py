from decimal import Decimal
from uuid import uuid4

import pytest
from fastapi import HTTPException
from sqlalchemy import select

from src.domains.auth.schemas import AuthenticatedUser
from src.domains.users.models import User
from src.domains.wallets.models import LedgerStatus, LedgerType, Wallet, WalletLedger
from src.domains.wallets.schemas import WalletDeposit, WalletLedgerCreate, WalletWithdraw
from src.domains.wallets.service import WalletService
from src.domains.users.models import UserRoles


async def _make_user(db_session) -> AuthenticatedUser:
    user = User(
        id=uuid4(),
        username=f"user_{uuid4().hex[:8]}",
        email=f"{uuid4().hex[:8]}@coopwise.example",
        full_name="Test Wallet User",
    )
    db_session.add(user)
    await db_session.flush()
    return AuthenticatedUser(id=user.id, email=user.email, role=UserRoles.user)


async def _get_wallet(db_session, user_id):
    result = await db_session.execute(select(Wallet).where(Wallet.user_id == user_id))
    return result.scalars().first()


@pytest.mark.asyncio
async def test_create_user_wallet(db_session):
    user = await _make_user(db_session)
    wallet = await WalletService.create_user_wallet(user, db_session)

    assert wallet.user_id == user.id
    assert wallet.stable_coin_balance == 0
    assert wallet.stable_coin_locked == 0


@pytest.mark.asyncio
async def test_deposit_creates_wallet_if_missing_and_credits_balance(db_session):
    user = await _make_user(db_session)
    assert await _get_wallet(db_session, user.id) is None

    detail = await WalletService.deposit(
        WalletDeposit(payment_gateway="mock_success", local_amount=Decimal("1600"), currency="NGN"),
        db_session,
        user,
        None,
    )

    assert detail.stable_coin_balance == Decimal("1.00000000")
    wallet = await _get_wallet(db_session, user.id)
    assert wallet is not None
    assert wallet.stable_coin_balance == Decimal("1.00000000")


@pytest.mark.asyncio
async def test_withdraw_missing_wallet_raises_404(db_session):
    user = await _make_user(db_session)

    with pytest.raises(HTTPException) as exc_info:
        await WalletService.withdraw(
            WalletWithdraw(local_amount=Decimal("100")), db_session, user, None
        )
    assert exc_info.value.status_code == 404


@pytest.mark.asyncio
async def test_withdraw_insufficient_balance_raises_400(db_session):
    user = await _make_user(db_session)
    await WalletService.create_user_wallet(user, db_session)

    with pytest.raises(HTTPException) as exc_info:
        await WalletService.withdraw(
            WalletWithdraw(local_amount=Decimal("1600")), db_session, user, None
        )
    assert exc_info.value.status_code == 400


@pytest.mark.asyncio
async def test_withdraw_happy_path_debits_balance(db_session):
    user = await _make_user(db_session)
    await WalletService.deposit(
        WalletDeposit(payment_gateway="mock_success", local_amount=Decimal("3200"), currency="NGN"),
        db_session,
        user,
        None,
    )

    result = await WalletService.withdraw(
        WalletWithdraw(local_amount=Decimal("1600")), db_session, user, None
    )

    assert result["message"] == "Withdrawal successful"
    assert result["wallet"].stable_coin_balance == Decimal("1.00000000")


@pytest.mark.asyncio
async def test_lock_for_contribution_missing_wallet_returns_failure_dict(db_session):
    result = await WalletService.lock_for_contribution(uuid4(), Decimal("1"), db_session)
    assert result == {"success": False, "error": "Wallet not found"}


@pytest.mark.asyncio
async def test_lock_for_contribution_insufficient_balance_returns_failure_dict(db_session):
    user = await _make_user(db_session)
    await WalletService.create_user_wallet(user, db_session)

    result = await WalletService.lock_for_contribution(user.id, Decimal("5"), db_session)

    assert result == {"success": False, "error": "Insufficient balance"}
    wallet = await _get_wallet(db_session, user.id)
    assert wallet.stable_coin_balance == 0
    assert wallet.stable_coin_locked == 0


@pytest.mark.asyncio
async def test_lock_for_contribution_moves_funds_from_balance_to_locked(db_session):
    user = await _make_user(db_session)
    await WalletService.deposit(
        WalletDeposit(payment_gateway="mock_success", local_amount=Decimal("1600"), currency="NGN"),
        db_session,
        user,
        None,
    )

    result = await WalletService.lock_for_contribution(user.id, Decimal("1"), db_session)

    assert result == {"success": True, "locked_amount": Decimal("1")}
    wallet = await _get_wallet(db_session, user.id)
    assert wallet.stable_coin_balance == Decimal("0.00000000")
    assert wallet.stable_coin_locked == Decimal("1.00000000")


@pytest.mark.asyncio
async def test_finalize_contribution_debit_insufficient_locked_returns_failure_dict(db_session):
    user = await _make_user(db_session)
    await WalletService.create_user_wallet(user, db_session)

    result = await WalletService.finalize_contribution_debit(user.id, Decimal("1"), db_session)

    assert result == {"success": False, "error": "Insufficient locked funds"}


@pytest.mark.asyncio
async def test_lock_then_finalize_round_trip_leaves_balances_consistent(db_session):
    user = await _make_user(db_session)
    await WalletService.deposit(
        WalletDeposit(payment_gateway="mock_success", local_amount=Decimal("1600"), currency="NGN"),
        db_session,
        user,
        None,
    )
    await WalletService.lock_for_contribution(user.id, Decimal("1"), db_session)

    result = await WalletService.finalize_contribution_debit(user.id, Decimal("1"), db_session)

    assert result == {"success": True, "finalized_amount": Decimal("1")}
    wallet = await _get_wallet(db_session, user.id)
    # Finalized funds leave both balance and locked at zero — they've moved
    # out to the contribution pool, not back to the wallet.
    assert wallet.stable_coin_balance == Decimal("0.00000000")
    assert wallet.stable_coin_locked == Decimal("0.00000000")


@pytest.mark.asyncio
async def test_lock_then_release_round_trip_restores_balance(db_session):
    user = await _make_user(db_session)
    await WalletService.deposit(
        WalletDeposit(payment_gateway="mock_success", local_amount=Decimal("1600"), currency="NGN"),
        db_session,
        user,
        None,
    )
    await WalletService.lock_for_contribution(user.id, Decimal("1"), db_session)

    result = await WalletService.release_locked_funds(user.id, Decimal("1"), db_session)

    assert result == {"success": True, "released_amount": Decimal("1")}
    wallet = await _get_wallet(db_session, user.id)
    assert wallet.stable_coin_balance == Decimal("1.00000000")
    assert wallet.stable_coin_locked == Decimal("0.00000000")


@pytest.mark.asyncio
async def test_release_locked_funds_insufficient_locked_returns_failure_dict(db_session):
    user = await _make_user(db_session)
    await WalletService.deposit(
        WalletDeposit(payment_gateway="mock_success", local_amount=Decimal("1600"), currency="NGN"),
        db_session,
        user,
        None,
    )

    result = await WalletService.release_locked_funds(user.id, Decimal("1"), db_session)

    assert result == {"success": False, "error": "Insufficient locked funds to release"}
    wallet = await _get_wallet(db_session, user.id)
    # Balance from the deposit must be untouched by the failed release.
    assert wallet.stable_coin_balance == Decimal("1.00000000")


@pytest.mark.asyncio
async def test_get_effective_balance_missing_wallet_returns_zero(db_session):
    balance = await WalletService.get_effective_balance(uuid4(), db_session)
    assert balance == Decimal(0)


@pytest.mark.asyncio
async def test_get_effective_balance_returns_stable_coin_balance(db_session):
    user = await _make_user(db_session)
    await WalletService.deposit(
        WalletDeposit(payment_gateway="mock_success", local_amount=Decimal("1600"), currency="NGN"),
        db_session,
        user,
        None,
    )

    balance = await WalletService.get_effective_balance(user.id, db_session)
    assert balance == Decimal("1.00000000")


@pytest.mark.asyncio
async def test_settle_payment_ledger_into_wallet_ledger_not_found_raises_404(db_session):
    with pytest.raises(HTTPException) as exc_info:
        await WalletService.settle_payment_ledger_into_wallet(str(uuid4()), db_session, None)
    assert exc_info.value.status_code == 404


@pytest.mark.asyncio
async def test_settle_payment_ledger_into_wallet_credits_balance(db_session):
    user = await _make_user(db_session)
    wallet = await WalletService.create_user_wallet(user, db_session)

    ledger = await WalletService.record_ledger_entry(
        WalletLedgerCreate(
            wallet_id=wallet.id,
            reference=f"ref-{uuid4().hex[:8]}",
            type=LedgerType.deposit,
            stable_amount=2.5,
            local_amount=4000,
            local_currency="NGN",
            exchange_rate=0.000625,
        ),
        db_session,
    )

    updated_wallet = await WalletService.settle_payment_ledger_into_wallet(
        str(ledger.id), db_session, None
    )

    assert updated_wallet.stable_coin_balance == Decimal("2.5")

    refreshed = await WalletService.get_wallet_ledger_record_by_id(str(ledger.id), db_session)
    assert refreshed.status == LedgerStatus.settled


@pytest.mark.asyncio
async def test_settle_payment_ledger_into_wallet_already_settled_raises_400(db_session):
    user = await _make_user(db_session)
    wallet = await WalletService.create_user_wallet(user, db_session)

    ledger = await WalletService.record_ledger_entry(
        WalletLedgerCreate(
            wallet_id=wallet.id,
            reference=f"ref-{uuid4().hex[:8]}",
            type=LedgerType.deposit,
            stable_amount=1,
            local_amount=1600,
            local_currency="NGN",
            exchange_rate=0.000625,
            status=LedgerStatus.settled,
        ),
        db_session,
    )

    with pytest.raises(HTTPException) as exc_info:
        await WalletService.settle_payment_ledger_into_wallet(str(ledger.id), db_session, None)
    assert exc_info.value.status_code == 400
