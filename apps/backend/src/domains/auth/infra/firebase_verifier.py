"""
Firebase ID token verifier (Google sign-in via Firebase) — manual JWKS
verification.

Needs only your Firebase PROJECT_ID (a public, non-secret string) — we
fetch Google's public signing certs from a public endpoint and verify
signature/issuer/audience/expiry ourselves. No service account private
key required for this (that's only needed for broader Firebase Admin
access — push notifications, managing users, etc. — which we don't use).
"""
from __future__ import annotations

from typing import Any, Dict

import httpx
from cryptography.hazmat.backends import default_backend
from cryptography.x509 import load_pem_x509_certificate
from jose import jwt

from src.domains.auth.exceptions import FirebaseVerificationError
from src.domains.auth.ports import FirebaseIdentity
from src.shared.utils.logger import logger


class FirebaseOAuthProvider:

    CERTS_URL = "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com"

    def __init__(self, project_id: str):
        self.project_id = project_id

    async def verify_token(self, token: str) -> Dict[str, Any]:
        try:
            async with httpx.AsyncClient() as client:
                r = await client.get(self.CERTS_URL)
                certs = r.json()

            header = jwt.get_unverified_header(token)
            kid = header.get("kid")

            if kid not in certs:
                raise ValueError(f"Certificate for key id {kid} not found.")

            # Load the PEM cert and extract the public key
            cert_bytes = certs[kid].encode("utf-8")
            cert = load_pem_x509_certificate(cert_bytes, default_backend())
            public_key = cert.public_key()

            claims = jwt.decode(
                token,
                public_key,
                algorithms=["RS256"],
                audience=self.project_id,
                issuer=f"https://securetoken.google.com/{self.project_id}",
            )
            return claims

        except Exception as e:
            if "expired" in str(e).lower():
                raise ValueError("Firebase token has expired")
            logger.error(f"Firebase token verification failed: {e}")
            raise ValueError(f"Invalid Firebase token: {e}")

    async def extract_identity(self, claims: Dict[str, Any]) -> FirebaseIdentity:
        return FirebaseIdentity(
            firebase_uid=claims["sub"],  # uid is in "sub" in raw JWT
            email=claims.get("email"),
            email_verified=claims.get("email_verified", False),
            full_name=claims.get("name"),
            picture_url=claims.get("picture"),
        )


class FirebaseVerifier:
    """
    Adapts FirebaseOAuthProvider to FirebaseVerifierPort — the shape
    AuthService actually depends on (one method, verify_id_token,
    returning FirebaseIdentity directly). Keeps the verify/extract split
    above intact rather than collapsing it, since that split is also
    useful standalone (e.g. re-extracting identity from already-verified
    claims elsewhere without a second network round-trip).
    """

    def __init__(self, project_id: str) -> None:
        self._provider = FirebaseOAuthProvider(project_id)

    async def verify_id_token(self, firebase_id_token: str) -> FirebaseIdentity:
        try:
            claims = await self._provider.verify_token(firebase_id_token)
        except ValueError as e:
            raise FirebaseVerificationError(str(e))

        if "sub" not in claims and "uid" not in claims:
            raise FirebaseVerificationError("Firebase token missing uid/sub claim")
        if "sub" not in claims:
            claims["sub"] = claims["uid"]

        return await self._provider.extract_identity(claims)