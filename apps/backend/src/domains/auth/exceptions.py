"""
Domain exceptions for the auth domain.

Why these instead of raising HTTPException directly from AuthService:
  - AuthService has zero FastAPI imports, so it's importable/testable in
    any context (script, worker, another framework) without pulling in
    fastapi.
  - The router is the ONLY place that translates domain exceptions into
    HTTP responses. One mapping point, not scattered try/excepts.

This PR keeps behavior identical to the pre-refactor code: the same
status codes and messages are produced, just via this translation layer
instead of raising HTTPException inline inside the service.
"""


class AuthDomainError(Exception):
    """Base class for all auth domain errors."""


class EmailAlreadyRegisteredError(AuthDomainError):
    pass


class UsernameAlreadyRegisteredError(AuthDomainError):
    pass


class PhoneNumberAlreadyRegisteredError(AuthDomainError):
    pass


class UserCreationError(AuthDomainError):
    def __init__(self, reason: str):
        self.reason = reason
        super().__init__(reason)


class InvalidCredentialsError(AuthDomainError):
    pass


class InvalidTokenError(AuthDomainError):
    pass


class TokenExpiredError(AuthDomainError):
    pass


class InvalidTokenTypeError(AuthDomainError):
    pass


class UserNotFoundError(AuthDomainError):
    pass


class WalletSyncError(AuthDomainError):
    pass
