import time

import httpx

from config import AppConfig as config
from src.domains.kyc.ports import BankAccountVerificationResult
from src.shared.utils.logger import logger

PAYSTACK_BANK_URL = "https://api.paystack.co/bank"
PAYSTACK_RESOLVE_URL = "https://api.paystack.co/bank/resolve"

# The Nigerian bank list changes rarely; cache it per worker instead of
# calling Paystack on every visit to the banking step.
_BANK_CACHE_TTL_SECONDS = 24 * 60 * 60
_bank_cache: tuple[float, list[dict]] | None = None


class BankDirectoryError(Exception):
    """Paystack's bank list could not be loaded."""


def _masked(account_number: str) -> str:
    return f"***{account_number[-4:]}" if len(account_number) > 4 else "***"


class PaystackBankVerificationProvider:
    """
    Real NUBAN account resolution through Paystack.

    `/bank` gives the member a searchable list of banks (so nobody types a
    bank code by hand) and `/bank/resolve` turns a bank code + 10-digit
    account number into the registered account name.
    """

    def __init__(self, secret_key: str | None = None, timeout: float = 10.0):
        self._secret_key = secret_key or config.PAYSTACK_SECRET_KEY
        self._timeout = timeout

    @property
    def _headers(self) -> dict[str, str]:
        return {"Authorization": f"Bearer {self._secret_key}"}

    async def list_banks(self) -> list[dict]:
        global _bank_cache

        now = time.monotonic()
        if _bank_cache and now - _bank_cache[0] < _BANK_CACHE_TTL_SECONDS:
            return _bank_cache[1]

        try:
            async with httpx.AsyncClient(timeout=self._timeout) as client:
                response = await client.get(
                    PAYSTACK_BANK_URL,
                    params={"country": "nigeria", "currency": "NGN"},
                    headers=self._headers,
                )
        except httpx.HTTPError as exc:
            logger.warning("Paystack bank list request failed: %s", exc)
            raise BankDirectoryError("Could not reach Paystack") from exc

        body = self._json(response)
        if response.status_code != 200 or not body.get("status"):
            logger.warning(
                "Paystack bank list rejected (%s): %s",
                response.status_code,
                body.get("message"),
            )
            raise BankDirectoryError(body.get("message") or "Bank list unavailable")

        banks = [
            {"name": bank["name"], "code": bank["code"]}
            for bank in (body.get("data") or [])
            if bank.get("name") and bank.get("code")
        ]
        _bank_cache = (now, banks)
        return banks

    async def resolve_account_name(
        self,
        bank_code: str,
        account_number: str,
    ) -> BankAccountVerificationResult:
        try:
            async with httpx.AsyncClient(timeout=self._timeout) as client:
                response = await client.get(
                    PAYSTACK_RESOLVE_URL,
                    params={
                        "bank_code": bank_code,
                        "account_number": account_number,
                    },
                    headers=self._headers,
                )
        except httpx.HTTPError as exc:
            logger.warning(
                "Paystack account resolution request failed for %s: %s",
                _masked(account_number),
                exc,
            )
            return BankAccountVerificationResult(
                success=False,
                resolved_account_name=None,
                raw_response={
                    "provider": "paystack",
                    "message": "Could not reach the bank verification service",
                },
            )

        body = self._json(response)
        if response.status_code != 200 or not body.get("status"):
            logger.info(
                "Paystack could not resolve %s at bank %s: %s",
                _masked(account_number),
                bank_code,
                body.get("message"),
            )
            return BankAccountVerificationResult(
                success=False,
                resolved_account_name=None,
                raw_response={
                    "provider": "paystack",
                    "message": body.get("message") or "Unable to resolve account",
                },
            )

        data = body.get("data") or {}
        account_name = data.get("account_name")
        if not account_name:
            return BankAccountVerificationResult(
                success=False,
                resolved_account_name=None,
                raw_response={
                    "provider": "paystack",
                    "message": "Paystack returned no account name",
                },
            )

        return BankAccountVerificationResult(
            success=True,
            resolved_account_name=account_name,
            raw_response={"provider": "paystack", "data": data},
        )

    @staticmethod
    def _json(response: httpx.Response) -> dict:
        try:
            body = response.json()
        except ValueError:
            return {}
        return body if isinstance(body, dict) else {}


class MockBankVerificationProvider:
    """
    Mock bank verification provider.

    Simulates an external bank account resolution service
    before integrating with providers like Paystack/Interswitch.
    """

    async def list_banks(self) -> list[dict]:
        return [
            {"name": "Access Bank", "code": "044"},
            {"name": "Guaranty Trust Bank", "code": "058"},
            {"name": "Zenith Bank", "code": "057"},
        ]

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
            resolved_account_name="OG Bellz | Abeleje Olaniyi | Olaniyi George",
            raw_response={
                "provider": "mock",
                "message": "Account resolved successfully",
                "bank_code": bank_code,
                "account_number": account_number,
            },
        )
