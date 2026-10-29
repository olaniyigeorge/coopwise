from src.domains.kyc.models import KYCStatus, KYCStepStatus, KYCVerification


def is_kyc_complete(kyc: KYCVerification | None) -> bool:
    """Return the effective KYC state, including all required step records."""
    if not kyc or kyc.status != KYCStatus.verified:
        return False

    steps = (
        kyc.personal_info,
        kyc.contact_info,
        kyc.identity_verification,
        kyc.banking_info,
    )
    return all(step is not None and step.status == KYCStepStatus.approved for step in steps)
