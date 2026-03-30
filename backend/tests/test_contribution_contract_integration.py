import pytest
from uuid import uuid4
from decimal import Decimal
from unittest.mock import AsyncMock, patch

from app.services.contribution_service import ContributionService
from app.services.contract_service import contract_service
from app.services.wallet_service import WalletService
from app.schemas.contribution_schemas import ContributionCreate
from app.schemas.auth import AuthenticatedUser
from db.models.contribution_model import ContributionStatus


@pytest.mark.asyncio
class TestContributionService:
    """Test cases for the enhanced ContributionService"""

    @patch.object(contract_service, 'submit_contribution_onchain')
    @patch.object(WalletService, 'lock_for_contribution')
    @patch.object(WalletService, 'get_balance')
    async def test_process_manual_contribution_success(
        self, mock_get_balance, mock_lock_funds, mock_contract_submit, db_session
    ):
        """Test successful manual contribution processing"""
        # Setup mocks
        user = AuthenticatedUser(id=uuid4(), email="test@example.com")
        group_id = uuid4()

        mock_get_balance.return_value = type('Balance', (), {
            'stable_coin_balance': Decimal('1000.00')
        })()

        mock_lock_funds.return_value = {"success": True, "locked_amount": Decimal('500.00')}

        mock_contract_submit.return_value = {
            "success": True,
            "tx_hash": "flow_tx_test",
            "contribution_id": str(uuid4())
        }

        # Test data
        contribution_data = ContributionCreate(
            user_id=user.id,
            group_id=group_id,
            amount=500.00,
            currency="NGN",
            note="Test contribution"
        )

        # Execute
        result = await ContributionService.process_manual_contribution(
            contribution_data, user, db_session, "flow"
        )

        # Assertions
        assert result.status == ContributionStatus.completed
        assert "flow_tx_test" in result.note
        mock_lock_funds.assert_called_once()
        mock_contract_submit.assert_called_once()

    @patch.object(contract_service, 'submit_contribution_onchain')
    @patch.object(WalletService, 'lock_for_contribution')
    @patch.object(WalletService, 'get_balance')
    async def test_process_manual_contribution_insufficient_balance(
        self, mock_get_balance, mock_lock_funds, mock_contract_submit, db_session
    ):
        """Test manual contribution with insufficient balance"""
        user = AuthenticatedUser(id=uuid4(), email="test@example.com")
        group_id = uuid4()

        mock_get_balance.return_value = type('Balance', (), {
            'stable_coin_balance': Decimal('100.00')  # Less than required
        })()

        contribution_data = ContributionCreate(
            user_id=user.id,
            group_id=group_id,
            amount=500.00,
            currency="NGN"
        )

        # Should raise HTTPException
        with pytest.raises(Exception) as exc_info:
            await ContributionService.process_manual_contribution(
                contribution_data, user, db_session, "flow"
            )

        assert "Insufficient wallet balance" in str(exc_info.value)

    @patch.object(contract_service, 'submit_contribution_onchain')
    @patch.object(WalletService, 'lock_for_contribution')
    @patch.object(WalletService, 'release_locked_funds')
    @patch.object(WalletService, 'get_balance')
    async def test_process_manual_contribution_contract_failure(
        self, mock_get_balance, mock_release_funds, mock_lock_funds, mock_contract_submit, db_session
    ):
        """Test manual contribution with contract submission failure"""
        user = AuthenticatedUser(id=uuid4(), email="test@example.com")
        group_id = uuid4()

        mock_get_balance.return_value = type('Balance', (), {
            'stable_coin_balance': Decimal('1000.00')
        })()

        mock_lock_funds.return_value = {"success": True, "locked_amount": Decimal('500.00')}

        mock_contract_submit.return_value = {
            "success": False,
            "error": "Contract submission failed"
        }

        contribution_data = ContributionCreate(
            user_id=user.id,
            group_id=group_id,
            amount=500.00,
            currency="NGN"
        )

        # Should raise HTTPException and release funds
        with pytest.raises(Exception) as exc_info:
            await ContributionService.process_manual_contribution(
                contribution_data, user, db_session, "flow"
            )

        assert "Failed to submit contribution to smart contract" in str(exc_info.value)
        mock_release_funds.assert_called_once()


@pytest.mark.asyncio
class TestWalletServiceLocking:
    """Test cases for wallet locking functionality"""

    async def test_lock_for_contribution_success(self, db_session):
        """Test successful fund locking"""
        user_id = uuid4()
        amount = Decimal('500.00')

        # Create test wallet with sufficient balance
        wallet = await WalletService.create_user_wallet(
            AuthenticatedUser(id=user_id, email="test@example.com"), db_session
        )

        # Add balance
        wallet.stable_coin_balance = Decimal('1000.00')
        db_session.add(wallet)
        await db_session.commit()

        # Lock funds
        result = await WalletService.lock_for_contribution(user_id, amount, db_session)

        # Assertions
        assert result["success"] is True
        assert result["locked_amount"] == amount

        # Refresh wallet and check balances
        await db_session.refresh(wallet)
        assert wallet.stable_coin_balance == Decimal('500.00')  # 1000 - 500
        assert wallet.stable_coin_locked == Decimal('500.00')

    async def test_lock_for_contribution_insufficient_balance(self, db_session):
        """Test locking with insufficient balance"""
        user_id = uuid4()
        amount = Decimal('500.00')

        # Create test wallet with insufficient balance
        wallet = await WalletService.create_user_wallet(
            AuthenticatedUser(id=user_id, email="test@example.com"), db_session
        )
        wallet.stable_coin_balance = Decimal('100.00')  # Less than required
        db_session.add(wallet)
        await db_session.commit()

        # Attempt to lock funds
        result = await WalletService.lock_for_contribution(user_id, amount, db_session)

        # Assertions
        assert result["success"] is False
        assert "Insufficient balance" in result["error"]

    async def test_finalize_contribution_debit(self, db_session):
        """Test finalizing contribution debit"""
        user_id = uuid4()
        amount = Decimal('500.00')

        # Create test wallet
        wallet = await WalletService.create_user_wallet(
            AuthenticatedUser(id=user_id, email="test@example.com"), db_session
        )
        wallet.stable_coin_balance = Decimal('500.00')
        wallet.stable_coin_locked = Decimal('500.00')
        db_session.add(wallet)
        await db_session.commit()

        # Finalize debit
        result = await WalletService.finalize_contribution_debit(user_id, amount, db_session)

        # Assertions
        assert result["success"] is True
        assert result["finalized_amount"] == amount

        # Refresh wallet and check balances
        await db_session.refresh(wallet)
        assert wallet.stable_coin_balance == Decimal('500.00')  # Unchanged
        assert wallet.stable_coin_locked == Decimal('0.00')  # Cleared

    async def test_release_locked_funds(self, db_session):
        """Test releasing locked funds back to balance"""
        user_id = uuid4()
        amount = Decimal('500.00')

        # Create test wallet
        wallet = await WalletService.create_user_wallet(
            AuthenticatedUser(id=user_id, email="test@example.com"), db_session
        )
        wallet.stable_coin_balance = Decimal('0.00')
        wallet.stable_coin_locked = Decimal('500.00')
        db_session.add(wallet)
        await db_session.commit()

        # Release funds
        result = await WalletService.release_locked_funds(user_id, amount, db_session)

        # Assertions
        assert result["success"] is True
        assert result["released_amount"] == amount

        # Refresh wallet and check balances
        await db_session.refresh(wallet)
        assert wallet.stable_coin_balance == Decimal('500.00')  # Restored
        assert wallet.stable_coin_locked == Decimal('0.00')  # Cleared


@pytest.mark.asyncio
class TestContractService:
    """Test cases for contract service integration"""

    @patch.object(contract_service, '_call_flow_contract')
    async def test_submit_contribution_onchain_flow_success(self, mock_flow_call):
        """Test successful contribution submission to Flow"""
        mock_flow_call.return_value = "flow_tx_123"

        result = await contract_service.submit_contribution_onchain(
            group_id=uuid4(),
            contribution_id=uuid4(),
            amount=Decimal('500.00'),
            user_address="user_addr",
            network="flow"
        )

        assert result["success"] is True
        assert result["tx_hash"] == "flow_tx_123"
        assert result["network"] == "flow"
        mock_flow_call.assert_called_once()

    @patch.object(contract_service, '_call_zama_contract')
    async def test_submit_contribution_onchain_zama_success(self, mock_zama_call):
        """Test successful contribution submission to Zama"""
        mock_zama_call.return_value = "zama_tx_456"

        result = await contract_service.submit_contribution_onchain(
            group_id=uuid4(),
            contribution_id=uuid4(),
            amount=Decimal('500.00'),
            user_address="user_addr",
            network="zama"
        )

        assert result["success"] is True
        assert result["tx_hash"] == "zama_tx_456"
        assert result["network"] == "zama"
        mock_zama_call.assert_called_once()

    async def test_submit_contribution_onchain_invalid_network(self):
        """Test contribution submission with invalid network"""
        result = await contract_service.submit_contribution_onchain(
            group_id=uuid4(),
            contribution_id=uuid4(),
            amount=Decimal('500.00'),
            user_address="user_addr",
            network="invalid"
        )

        assert result["success"] is False
        assert "Unsupported network" in result["error"]

    @patch.object(contract_service, '_query_flow_contract')
    async def test_query_contribution_status_success(self, mock_flow_query):
        """Test querying contribution status"""
        mock_flow_query.return_value = {
            "status": 3,  # Completed
            "amount": 500000000,  # 500.00 * 10^6
            "timestamp": 1640995200
        }

        result = await contract_service.query_contribution_status(
            contribution_id=uuid4(),
            network="flow"
        )

        assert result is not None
        assert result["status"] == 3
        assert result["amount"] == 500000000
        assert result["network"] == "flow"