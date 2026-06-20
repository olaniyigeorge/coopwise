from __future__ import annotations

from datetime import timedelta

from jose import JWTError, jwt

from src.domains.auth.exceptions import InvalidTokenError


class JoseTokenService:
    def __init__(self, secret_key: str, algorithm: str) -> None:
        self._secret_key = secret_key
        self._algorithm = algorithm

    def encode(self, claims: dict, expires_delta: timedelta) -> str:
        return jwt.encode(claims, self._secret_key, algorithm=self._algorithm)

    def decode(self, token: str) -> dict:
        try:
            return jwt.decode(token, self._secret_key, algorithms=[self._algorithm])
        except JWTError:
            raise InvalidTokenError("Invalid credentials")
