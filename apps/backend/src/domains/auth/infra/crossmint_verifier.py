"""
Crossmint verifier adapter.

This is the ONLY file in the auth domain allowed to know about Crossmint's
JWKS endpoint or REST API shape. AuthService depends on CrossmintVerifierPort
(ports.py) and never imports this module directly — it's wired in via
dependencies.py.

There is no Python/FastAPI server SDK from Crossmint — @crossmint/server-sdk
is TypeScript-only. So this adapter does directly what their Node SDK does
internally for verifyCrossmintJwt: fetch their published JWKS and verify
signature/issuer/audience/expiry ourselves. For profile data beyond what's
in the JWT, we call Crossmint's REST API server-to-server with our own
server API key (never a client-supplied key).

JWKS endpoint: https://www.crossmint.com/.well-known/jwks.json
"""
from __future__ import annotations

import time
from typing import Optional

import httpx
from jose import jwt
from jose.exceptions import JOSEError

from src.domains.auth.exceptions import CrossmintVerificationError
from src.domains.auth.ports import CrossmintIdentity
from src.shared.utils.logger import logger

CROSSMINT_JWKS_URL = "https://www.crossmint.com/.well-known/jwks.json"
CROSSMINT_ISSUER = "https://www.crossmint.com"
JWKS_CACHE_TTL_SECONDS = 3600


class CrossmintVerifier:
    def __init__(
        self,
        *,
        server_api_key: str,
        audience: str,
        api_base_url: str = "https://www.crossmint.com/api",
        http_client: Optional[httpx.AsyncClient] = None,
    ) -> None:
        self._server_api_key = server_api_key
        self._audience = audience
        self._api_base_url = api_base_url.rstrip("/")
        self._http = http_client or httpx.AsyncClient(timeout=10.0)
        self._jwks_cache: Optional[dict] = None
        self._jwks_cached_at: float = 0.0

    # ------------------------------------------------------------- CrossmintVerifierPort
    async def verify_session(
        self, jwt_token: str, refresh_token: Optional[str] = None
    ) -> CrossmintIdentity:
        jwks = await self._get_jwks()
        try:
            unverified_header = jwt.get_unverified_header(jwt_token)
        except JOSEError as e:
            raise CrossmintVerificationError(f"Malformed Crossmint JWT: {e}")

        key = self._find_signing_key(jwks, unverified_header.get("kid"))
        if key is None:
            # Key rotation may have invalidated our cache — refresh once and retry.
            jwks = await self._get_jwks(force_refresh=True)
            key = self._find_signing_key(jwks, unverified_header.get("kid"))
            if key is None:
                raise CrossmintVerificationError("No matching Crossmint signing key found")

        try:
            claims = jwt.decode(
                jwt_token,
                key,
                algorithms=["RS256"],
                audience=self._audience,
                issuer=CROSSMINT_ISSUER,
            )
        except JOSEError as e:
            raise CrossmintVerificationError(f"Crossmint JWT verification failed: {e}")

        crossmint_user_id = claims.get("sub") or claims.get("userId")
        if not crossmint_user_id:
            raise CrossmintVerificationError("Crossmint JWT missing subject/user id")

        return CrossmintIdentity(
            crossmint_user_id=crossmint_user_id,
            email=claims.get("email"),
            phone_number=claims.get("phoneNumber"),
        )

    async def fetch_profile(self, crossmint_user_id: str) -> CrossmintIdentity:
        url = f"{self._api_base_url}/v1-alpha2/users/{crossmint_user_id}"
        try:
            resp = await self._http.get(
                url, headers={"X-API-KEY": self._server_api_key}
            )
            resp.raise_for_status()
        except httpx.HTTPError as e:
            logger.error(f"[CrossmintVerifier] profile fetch failed: {e}")
            raise CrossmintVerificationError(
                f"Could not fetch Crossmint profile for {crossmint_user_id}"
            )

        data = resp.json()
        return CrossmintIdentity(
            crossmint_user_id=data.get("userId", crossmint_user_id),
            email=data.get("email"),
            phone_number=data.get("phoneNumber"),
        )

    # ----------------------------------------------------------------- internals
    async def _get_jwks(self, force_refresh: bool = False) -> dict:
        now = time.monotonic()
        if (
            not force_refresh
            and self._jwks_cache is not None
            and (now - self._jwks_cached_at) < JWKS_CACHE_TTL_SECONDS
        ):
            return self._jwks_cache

        try:
            resp = await self._http.get(CROSSMINT_JWKS_URL)
            resp.raise_for_status()
        except httpx.HTTPError as e:
            if self._jwks_cache is not None:
                # Serve stale keys rather than hard-fail on a transient network blip.
                logger.error(f"[CrossmintVerifier] JWKS refresh failed, using stale cache: {e}")
                return self._jwks_cache
            raise CrossmintVerificationError(f"Could not fetch Crossmint JWKS: {e}")

        self._jwks_cache = resp.json()
        self._jwks_cached_at = now
        return self._jwks_cache

    @staticmethod
    def _find_signing_key(jwks: dict, kid: Optional[str]) -> Optional[dict]:
        if kid is None:
            return None
        for key in jwks.get("keys", []):
            if key.get("kid") == kid:
                return key
        return None