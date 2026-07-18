"""
Crossmint Wallets REST client. Server-to-server only — authenticates with
X-API-KEY, never the platform JWT (that's the separate, client-side BYOA
mechanism used for user-initiated signing flows, not this adapter).

Implements both:
  - auth.ports.WalletProviderPort   (provision_wallet)
  - wallet.ports.WalletQueryPort    (get_wallet, get_balance, transfer_tokens)
so DI can hand out ONE instance satisfying both narrow ports, rather than
maintaining two separate HTTP clients against the same API.
"""
from __future__ import annotations

from typing import Any, Optional
from uuid import UUID

import httpx

from src.domains.auth.exceptions import WalletProvisioningError
from src.domains.wallets.exceptions import (
    CrossmintApiError,
    WalletNotFoundError,
    WalletTransferError,
    WalletBalanceError,
)
from src.shared.utils.logger import logger


class _WalletLocator:
    @staticmethod
    def by_user_id(user_id: UUID, chain: str, wallet_type: str = "smart") -> str:
        return f"userId:{user_id}:{chain}:{wallet_type}"


class CrossmintWalletClient:
    def __init__(
        self,
        *,
        server_api_key: str,
        chain: str = "solana",
        api_base_url: str = "https://www.crossmint.com/api",
    ) -> None:
        self._server_api_key = server_api_key
        self._chain = chain
        self._api_base_url = api_base_url.rstrip("/")
        self._http = httpx.AsyncClient(timeout=15.0)

    async def aclose(self) -> None:
        await self._http.aclose()

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

    # ---- WalletProviderPort (auth domain) ---------------------------------

    async def provision_wallet(self, user_id: UUID, user_email: str) -> str:
        payload = {
            "chainType": self._chain,
            "type": "smart",
            "config": {
                "adminSigner": {"type": "email", "email": user_email},
            },
            "owner": f"userId:{user_id}",
        }
        data = await self._request(
            "POST", "/wallets",
            json=payload,
            idempotency_key=f"provision-{user_id}",
            error_cls=WalletProvisioningError,
            error_context=f"user_id={user_id}",
        )
        address = data.get("address")
        if not address:
            raise WalletProvisioningError(f"Crossmint response missing wallet address for user {user_id}")
        return address

    # ---- WalletQueryPort (wallet domain) -----------------------------

    async def get_wallet(self, user_id: UUID) -> dict[str, Any]:
        locator = _WalletLocator.by_user_id(user_id, self._chain)
        return await self._request(
            "GET", f"/wallets/{locator}",
            error_cls=WalletNotFoundError,
            error_context=f"user_id={user_id}",
        )

    async def get_balance(
        self,
        user_id: UUID,
        tokens: list[str],
        chains: Optional[list[str]] = None,
    ) -> dict[str, Any]:
        locator = _WalletLocator.by_user_id(user_id, self._chain)
        params: dict[str, Any] = {"tokens": ",".join(tokens)}
        if chains:
            params["chains"] = ",".join(chains)
        return await self._request(
            "GET", f"/wallets/{locator}/balances",
            params=params,
            error_cls=WalletBalanceError,
            error_context=f"user_id={user_id}",
        )

    async def transfer_tokens(
        self,
        user_id: UUID,
        token_locator: str,
        recipient: str,
        amount: str,
        idempotency_key: Optional[str] = None,
    ) -> dict[str, Any]:
        locator = _WalletLocator.by_user_id(user_id, self._chain)
        return await self._request(
            "POST", f"/wallets/{locator}/tokens/{token_locator}/transfers",
            json={"recipient": recipient, "amount": amount},
            idempotency_key=idempotency_key,
            error_cls=WalletTransferError,
            error_context=f"user_id={user_id} token={token_locator} recipient={recipient} amount={amount}",
        )