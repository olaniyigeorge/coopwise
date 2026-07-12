"""
Domain exceptions for the auth domain (BYOA).

Why these instead of raising HTTPException directly from AuthService: the
router is the ONLY place that translates domain exceptions into HTTP
responses, and AuthService stays importable/testable without fastapi.
"""


class AuthDomainError(Exception):
    """Base class for all auth domain errors."""


class OtpDeliveryError(AuthDomainError):
    """SMS/email provider failed to send the code."""

    
class InvalidCredentialsError(AuthDomainError):
    """Identifier/password mismatch, or account has no password set.
    Deliberately generic — don't let this leak whether an account exists."""

class OtpRateLimitedError(AuthDomainError):
    """Too many OTP requests for this identifier too recently."""


class OtpInvalidOrExpiredError(AuthDomainError):
    """Code didn't match, expired, or was already used. Deliberately
    generic — never reveals which, to avoid leaking whether a code
    ever existed for a given identifier."""


class FullNameRequiredError(AuthDomainError):
    """First-time registration via OTP requires full_name; this identifier
    has no existing account and none was supplied."""


class FirebaseVerificationError(AuthDomainError):
    """Firebase ID token failed verification."""


class InvalidTokenError(AuthDomainError):
    """Our OWN platform JWT failed to decode/verify."""


class TokenExpiredError(AuthDomainError):
    pass


class InvalidTokenTypeError(AuthDomainError):
    pass


class UserNotFoundError(AuthDomainError):
    pass


class WalletProvisioningError(AuthDomainError):
    """Crossmint BYOA wallet provisioning failed. Raised only inside the
    background task — must never propagate into the login/registration
    request path."""