"""
Auth router (BYOA).

CHANGED vs the Crossmint-Auth version:
  - /session (Crossmint JWT exchange) is GONE.
  - Four endpoints now: request-otp, verify-otp, firebase, session/refresh.
"""
from fastapi import APIRouter, Depends, HTTPException

from src.domains.auth.dependencies import get_auth_service
from src.domains.auth.exceptions import (
    AuthDomainError,
    FirebaseVerificationError,
    FullNameRequiredError,
    InvalidTokenTypeError,
    OtpDeliveryError,
    OtpInvalidOrExpiredError,
    OtpRateLimitedError,
    TokenExpiredError,
    UserNotFoundError,
)
from src.domains.auth.schemas import (
    DevSignIn,
    FirebaseSignIn,
    RequestOtp,
    SessionResponse,
    VerifyOtp,
)
from src.domains.auth.service import AuthService

router = APIRouter(prefix="/api/v1/auth", tags=["Auth & Onboarding"])


@router.post("/otp/request", status_code=204)
async def request_otp(
    payload: RequestOtp,
    auth_service: AuthService = Depends(get_auth_service),
):
    """Sends a one-time code via SMS or email depending on `channel`.
    Works identically whether this identifier belongs to an existing
    user or not — the client doesn't need to know in advance which."""
    try:
        await auth_service.request_otp(payload)
    except OtpRateLimitedError as e:
        raise HTTPException(status_code=429, detail=str(e))
    except OtpDeliveryError as e:
        raise HTTPException(status_code=502, detail=str(e))


@router.post("/otp/verify", response_model=SessionResponse)
async def verify_otp(
    payload: VerifyOtp,
    auth_service: AuthService = Depends(get_auth_service),
):
    """Verifies the code. full_name is required only when this identifier
    has no existing account (first-time registration) — the service
    raises FullNameRequiredError (400) in that case so the client can
    prompt for a name and resubmit, rather than guessing up front."""
    try:
        return await auth_service.verify_otp(payload)
    except OtpInvalidOrExpiredError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except FullNameRequiredError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/firebase", response_model=SessionResponse)
async def sign_in_with_firebase(
    payload: FirebaseSignIn,
    auth_service: AuthService = Depends(get_auth_service),
):
    """Google sign-in via Firebase. Frontend completes Google OAuth through
    Firebase client SDK, sends us the resulting Firebase ID token."""
    try:
        return await auth_service.sign_in_with_firebase(payload)
    except FirebaseVerificationError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except FullNameRequiredError as e:
        raise HTTPException(status_code=400, detail=str(e))


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



@router.post("/dev-sign-in", response_model=SessionResponse)
async def sign_in_dev(
    payload: DevSignIn,
    auth_service: AuthService = Depends(get_auth_service),
):
    """Ofline signin for developers with connecting to the internet. Same signature as 
    OAuth but works offline."""
    try:
        return await auth_service.sign_in_dev(payload)
    except AuthDomainError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except FullNameRequiredError as e:
        raise HTTPException(status_code=400, detail=str(e))
