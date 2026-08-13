from __future__ import annotations

from typing import Any, Optional, Protocol, runtime_checkable
from uuid import UUID


@runtime_checkable
class WalletProviderPort(Protocol):
    """
    Narrow boundary around wallet provisioning, called from a background
    task after a session already exists — never inline in login/
    registration, and a failure here must never surface as an auth
    failure to the user.
    """

    async def create_wallet(
        self,
        *,
        user_id: UUID,
        user_email: str,
        admin_signer_type: str = "email",
        idempotency_key: Optional[str] = None,
    ) -> dict[str, Any]:
        """Creates (or, if owner already has one, returns) a smart wallet.
        Raises WalletProvisioningError on failure. Caller extracts
        `data["address"]`."""
        ...
