"""
Domain exceptions for the auth domain.

Why these instead of raising HTTPException directly from AuthService:
  - AuthService has zero FastAPI imports, so it's importable/testable in
    any context (script, worker, another framework) without pulling in
    fastapi.
  - The router is the ONLY place that translates domain exceptions into
    HTTP responses. One mapping point, not scattered try/excepts.

CHANGED vs the password-auth version of this file:
  - Dropped: EmailAlreadyRegisteredError, UsernameAlreadyRegisteredError,
    PhoneNumberAlreadyRegisteredError, UserCreationError, InvalidCredentialsError.
    These all belonged to local registration/login, which no longer exists.
  - Added: CrossmintVerificationError. This is the new domain's primary
    failure mode — "the token we were handed did not check out" — and the
    router maps it to 401, same as the old InvalidCredentialsError did.
"""


class AuthDomainError(Exception):
    """Base class for all auth domain errors."""


class CrossmintVerificationError(AuthDomainError):
    """Raised when a Crossmint JWT/session fails signature, issuer,
    audience, or expiry verification, or when Crossmint's API rejects
    a server-to-server profile fetch."""


class InvalidTokenError(AuthDomainError):
    """Our OWN platform JWT failed to decode/verify."""


class TokenExpiredError(AuthDomainError):
    pass


class InvalidTokenTypeError(AuthDomainError):
    pass


class UserNotFoundError(AuthDomainError):
    pass