import httpx

from src.domains.kyc.schemas import VerificationResult
from src.domains.kyc.exceptions import TransientProviderError


# KYC verifiers like crossmint, Smile ID, Dojah, Youverify
class IdentityVerificationProvider():
    pass


class HttpIdentityVerificationProvider:
    async def verify_identity(self, **kwargs):
        try:
            response = await self._client.post("/verify", json=kwargs, timeout=30)
            response.raise_for_status()
        except httpx.TimeoutException as exc:
            raise TransientProviderError("Provider timeout") from exc
        except httpx.HTTPStatusError as exc:
            if exc.response.status_code >= 500 or exc.response.status_code == 429:
                raise TransientProviderError(f"Provider {exc.response.status_code}") from exc
            raise  # 4xx other than 429 is a real rejection, let it surface as-is
        return VerificationResult(**response.json())