from src.domains.kyc.ports import BankAccountVerificationResult


class MockBankVerificationProvider:
    """
    Mock bank verification provider.

    Simulates an external bank account resolution service
    before integrating with providers like Paystack/Interswitch.
    """

    async def resolve_account_name(
        self,
        bank_code: str,
        account_number: str,
    ) -> BankAccountVerificationResult:

        # Simulate failed verification
        if account_number == "0000000000":
            return BankAccountVerificationResult(
                success=False,
                resolved_account_name=None,
                raw_response={
                    "provider": "mock",
                    "message": "Unable to resolve account",
                    "bank_code": bank_code,
                    "account_number": account_number,
                },
            )

        # Simulate successful verification
        return BankAccountVerificationResult(
            success=True,
            resolved_account_name="OG bellz",
            raw_response={
                "provider": "mock",
                "message": "Account resolved successfully",
                "bank_code": bank_code,
                "account_number": account_number,
            },
        )