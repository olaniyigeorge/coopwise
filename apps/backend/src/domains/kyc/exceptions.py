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
    pass