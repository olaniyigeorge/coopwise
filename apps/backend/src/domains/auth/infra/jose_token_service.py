from __future__ import annotations

from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt

from src.domains.auth.exceptions import InvalidTokenError, TokenExpiredError


class JoseTokenService:
    """Mints/verifies OUR platform JWT. Unrelated to Crossmint's JWKS —
    see infra/crossmint_verifier.py for that boundary."""

    def __init__(self, secret_key: str, algorithm: str) -> None:
        self._secret_key = secret_key
        self._algorithm = algorithm

    def encode(self, claims: dict, expires_delta: timedelta) -> str:
        to_encode = claims.copy()
        # Defensive: honor expires_delta even if the caller already set "exp"
        # (AuthService does), so this adapter can't silently mint a
        # non-expiring token if called directly.
        to_encode.setdefault("exp", datetime.now(timezone.utc) + expires_delta)
        return jwt.encode(to_encode, self._secret_key, algorithm=self._algorithm)

    def decode(self, token: str) -> dict:
        try:
            return jwt.decode(token, self._secret_key, algorithms=[self._algorithm])
        except jwt.ExpiredSignatureError:
            raise TokenExpiredError("Token has expired")
        except JWTError:
            raise InvalidTokenError("Invalid credentials")
        
        

class AsymmetricTokenService:
    """Mints/verifies platform access tokens with ES256, so the public key
    can be published via JWKS for Crossmint (and other verifiers) to use."""

    def __init__(self, private_key_pem: str, public_key_pem: str, kid: str, algorithm: str = "ES256") -> None:
        self._private_key = private_key_pem
        self._public_key = public_key_pem
        self._kid = kid
        self._algorithm = algorithm

    def encode(self, claims: dict, expires_delta: timedelta) -> str:
        to_encode = claims.copy()
        to_encode.setdefault("exp", datetime.now(timezone.utc) + expires_delta)
        return jwt.encode(
            to_encode,
            self._private_key,
            algorithm=self._algorithm,
            headers={"kid": self._kid},
        )

    def decode(self, token: str) -> dict:
        try:
            return jwt.decode(token, self._public_key, algorithms=[self._algorithm])
        except jwt.ExpiredSignatureError:
            raise TokenExpiredError("Token has expired")
        except JWTError:
            raise InvalidTokenError("Invalid credentials")