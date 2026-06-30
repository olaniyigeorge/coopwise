"""
Auth router.
  - Two endpoints: POST /session (the only way to authenticate, ever)
    and POST /session/refresh (renew without re-touching Crossmint).
"""

from fastapi import APIRouter, Depends, HTTPException

from src.domains.auth.dependencies import get_auth_service
from src.domains.auth.exceptions import (
    CrossmintVerificationError,
    InvalidTokenTypeError,
    TokenExpiredError,
    UserNotFoundError,
)
from src.domains.auth.schemas import CrossmintSessionExchange, SessionResponse
from src.domains.auth.service import AuthService

router = APIRouter(prefix="/api/v1/auth", tags=["Auth & Onboarding"])


@router.post("/session", response_model=SessionResponse)
async def exchange_session(
    payload: CrossmintSessionExchange,
    auth_service: AuthService = Depends(get_auth_service),
):
    """
    The sole authentication entrypoint. Frontend calls this immediately
    after Crossmint's client SDK completes login (email OTP / Google / SMS)
    with the resulting Crossmint JWT. We verify it server-side against
    Crossmint's JWKS, provision a local account on first sight, and return
    our own short-lived platform access token + longer-lived refresh token.
    """
    try:
        return await auth_service.exchange_crossmint_session(payload)
    except CrossmintVerificationError as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.post("/session/refresh", response_model=SessionResponse)
async def refresh_session(
    refresh_token: str,
    auth_service: AuthService = Depends(get_auth_service),
):
    try:
        return await auth_service.refresh_platform_session(refresh_token)
    except UserNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except (InvalidTokenTypeError, TokenExpiredError) as e:
        raise HTTPException(status_code=401, detail=str(e))