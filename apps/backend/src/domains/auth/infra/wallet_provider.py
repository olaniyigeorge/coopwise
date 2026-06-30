"""
Crossmint BYOA wallet provisioning adapter.

Implements WalletProviderPort: ONE method, called only from a background
task (infra/tasks.py), never inline in the login/registration request path.

How BYOA custom tokens work (per docs.crossmint.com/wallets/guides/
bring-your-own-auth): our platform JWT's signing key is registered in the
Crossmint Console under "JWT Authentication > Custom tokens". Crossmint
extracts the user id from OUR token's claims and assigns wallet ownership
accordingly — there is no separate Crossmint-side login step, and no
Crossmint JWT verification happens anywhere in this codebase anymore.

NOTE: this hits Crossmint's wallet creation REST endpoint server-to-server
using our server API key (scope: wallets.create, per the BYOA prerequisites).
The exact request/response shape here is inferred from the docs page's
client-SDK examples (createWallet({chain, recovery: {type: "email", email}}))
translated to a server-side REST call — confirm the literal endpoint path
and payload shape against Crossmint's API reference before this goes live;
flagging this the same way crossmint_verifier.py's claim names were flagged
in the prior iteration.
"""
from __future__ import annotations

from uuid import UUID

import httpx

from src.domains.auth.exceptions import WalletProvisioningError
from src.shared.utils.logger import logger


class CrossmintWalletProvider:
    def __init__(
        self,
        *,
        server_api_key: str,
        chain: str = "base-sepolia",  # TODO: confirm target chain for production (mainnet vs testnet)
        api_base_url: str = "https://www.crossmint.com/api",
    ) -> None:
        self._server_api_key = server_api_key
        self._chain = chain
        self._api_base_url = api_base_url.rstrip("/")
        self._http = httpx.AsyncClient(timeout=15.0)

    async def provision_wallet(self, user_id: UUID, platform_jwt: str) -> str:
        url = f"{self._api_base_url}/2025-06-09/wallets"
        try:
            resp = await self._http.post(
                url,
                headers={
                    "X-API-KEY": self._server_api_key,
                    "Authorization": f"Bearer {platform_jwt}",
                },
                json={"chainType": "evm", "type": "smart"},
            )
            resp.raise_for_status()
        except httpx.HTTPError as e:
            logger.error(
                f"[CrossmintWalletProvider] provisioning failed for user {user_id}: {e}"
            )
            raise WalletProvisioningError(
                f"Could not provision wallet for user {user_id}"
            )

        data = resp.json()
        address = data.get("address")
        if not address:
            raise WalletProvisioningError(
                f"Crossmint response missing wallet address for user {user_id}"
            )
        return address