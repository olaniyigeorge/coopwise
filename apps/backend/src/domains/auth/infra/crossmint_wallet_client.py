"""
Crossmint Wallets REST client.

Server-to-server only — authenticates with X-API-KEY, never the platform
JWT (that's a separate, client-side BYOA mechanism; see module docstring
history in previous versions of this file for why that distinction matters).

Covers: wallet creation, retrieval, balance checks, token transfers.
Extend with additional methods (e.g. NFT operations, delegated signers)
following the same _request() pattern.
"""
from __future__ import annotations

from typing import Any, Optional
from uuid import UUID

import httpx

from src.domains.auth.exceptions import (
    CrossmintApiError,
    WalletProvisioningError,
    WalletNotFoundError,
    WalletTransferError,
)
from src.shared.utils.logger import logger


class WalletLocator:
    @staticmethod
    def by_user_id(user_id: UUID, chain: str, wallet_type: str = "smart") -> str:
        return f"userId:{user_id}:{chain}:{wallet_type}"

    @staticmethod
    def by_email(email: str, chain: str, wallet_type: str = "smart") -> str:
        return f"email:{email}:{chain}:{wallet_type}"

    @staticmethod
    def by_address(address: str) -> str:
        return address


class CrossmintWalletClient:
    def __init__(
        self,
        *,
        server_api_key: str,
        chain: str = "evm",
        api_base_url: str = "https://www.crossmint.com/api",
    ) -> None:
        self._server_api_key = server_api_key
        self._chain = chain
        self._api_base_url = api_base_url.rstrip("/")
        self._http = httpx.AsyncClient(timeout=15.0)

    async def aclose(self) -> None:
        await self._http.aclose()

    # ---- shared request helper -------------------------------------------

    async def _request(
        self,
        method: str,
        path: str,
        *,
        json: Optional[dict] = None,
        params: Optional[dict] = None,
        idempotency_key: Optional[str] = None,
        error_cls: type[CrossmintApiError] = CrossmintApiError,
        error_context: str = "",
    ) -> dict[str, Any]:
        headers = {"X-API-KEY": self._server_api_key}
        if idempotency_key:
            headers["x-idempotency-key"] = idempotency_key

        url = f"{self._api_base_url}/2025-06-09{path}"
        try:
            resp = await self._http.request(method, url, json=json, params=params, headers=headers)
            resp.raise_for_status()
        except httpx.HTTPStatusError as e:
            logger.error(f"[CrossmintWalletClient] {method} {path} failed: {e.response.status_code} {e.response.text} {error_context}")
            raise error_cls(f"Crossmint API error ({e.response.status_code}): {error_context}") from e
        except httpx.HTTPError as e:
            logger.error(f"[CrossmintWalletClient] {method} {path} failed: {e} {error_context}")
            raise error_cls(f"Crossmint API request failed: {error_context}") from e

        return resp.json()

    # ---- wallet lifecycle ---------------------------------------------

    async def create_wallet(
        self,
        *,
        user_id: UUID,
        user_email: str,
        admin_signer_type: str = "email",
        idempotency_key: Optional[str] = None,
    ) -> dict[str, Any]:
        """Creates (or, if owner already has one, returns) a smart wallet.
        Server-signer variant would swap adminSigner for {"type": "server",
        "address": <derived address>} — see Crossmint's server-signer guide
        if you move to that model later.
        """
        payload = {
            "chainType": self._chain,
            "type": "smart",
            "config": {
                "adminSigner": {"type": admin_signer_type, "email": user_email},
            },
            "owner": f"userId:{user_id}",
        }
        data = await self._request(
            "POST", "/wallets",
            json=payload,
            idempotency_key=idempotency_key or f"provision-{user_id}",
            error_cls=WalletProvisioningError,
            error_context=f"user_id={user_id}",
        )
        address = data.get("address")
        if not address:
            raise WalletProvisioningError(f"Crossmint response missing wallet address for user {user_id}")
        return data

    async def get_wallet(self, locator: str) -> dict[str, Any]:
        return await self._request(
            "GET", f"/wallets/{locator}",
            error_cls=WalletNotFoundError,
            error_context=f"locator={locator}",
        )

    # ---- balances --------------------------------------------------------

    async def get_balance(
        self,
        locator: str,
        tokens: list[str],
        chains: Optional[list[str]] = None,
    ) -> dict[str, Any]:
        params: dict[str, Any] = {"tokens": ",".join(tokens)}
        if chains:
            params["chains"] = ",".join(chains)
        return await self._request(
            "GET", f"/wallets/{locator}/balances",
            params=params,
            error_context=f"locator={locator}",
        )

    # ---- transfers ---------------------------------------------------

    async def transfer_tokens(
        self,
        locator: str,
        token_locator: str,
        recipient: str,
        amount: str,
        idempotency_key: Optional[str] = None,
    ) -> dict[str, Any]:
        """amount is decimal-string (e.g. "0.001"), not raw units."""
        return await self._request(
            "POST", f"/wallets/{locator}/tokens/{token_locator}/transfers",
            json={"recipient": recipient, "amount": amount},
            idempotency_key=idempotency_key,
            error_cls=WalletTransferError,
            error_context=f"locator={locator} token={token_locator} recipient={recipient} amount={amount}",
        )