from __future__ import annotations

from typing import Any, Optional, Protocol, runtime_checkable
from uuid import UUID


@runtime_checkable
class WalletQueryPort(Protocol):
    """
    Read/write boundary for wallet operations beyond provisioning:
    retrieval, balance checks, token transfers. Provisioning itself lives
    in src/domains/auth/ports.py's WalletProviderPort — this port assumes
    a wallet already exists.
    """

    async def get_wallet(self, user_id: UUID) -> dict[str, Any]:
        """Returns wallet details for the given user. Raises
        WalletNotFoundError if no wallet has been provisioned yet."""
        ...

    async def get_balance(
        self,
        user_id: UUID,
        tokens: list[str],
        chains: Optional[list[str]] = None,
    ) -> dict[str, Any]:
        """Returns balance info for the given tokens. Raises
        WalletBalanceError on failure."""
        ...

    async def transfer_tokens(
        self,
        user_id: UUID,
        token_locator: str,
        recipient: str,
        amount: str,
        idempotency_key: Optional[str] = None,
    ) -> dict[str, Any]:
        """amount is a decimal string (e.g. "0.001"), not raw units.
        Raises WalletTransferError on failure."""
        ...