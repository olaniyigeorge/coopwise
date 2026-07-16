class KYCError(Exception):
    """Base KYC domain exception."""


class KYCNotFoundError(KYCError):
    pass


class KYCAlreadyVerifiedError(KYCError):
    pass


class InvalidKYCStateTransitionError(KYCError):
    pass


class StepAlreadyApprovedError(KYCError):
    """Prevents overwriting an approved step's data without an explicit reopen."""


class IdentityVerificationFailedError(KYCError):
    pass


class BankAccountNameMismatchError(KYCError):
    def __init__(self, message: str, reason: str):
        super().__init__(message)
        self.reason = reason # resolution_failed | name_mismatch 

    def to_dict(self):
        return {
            "reason": self.reason,
        }
    

class TransientProviderError(Exception):
    """Retryable provider failure: timeout, 5xx, rate limit. Distinct from
    IdentityVerificationFailedError, which means the provider gave a
    definitive 'this person failed verification' answer and must NOT be
    retried — retrying a hard rejection just re-charges you for the same
    no."""