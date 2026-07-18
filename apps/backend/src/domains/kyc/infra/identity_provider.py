from typing import Optional

import httpx

from src.shared.utils.logger import logger
from src.domains.kyc.schemas import IdentityVerificationResult
from src.domains.kyc.exceptions import TransientProviderError


# KYC verifiers like crossmint, Smile ID, Dojah, Youverify
class MockIdentityVerificationProvider():
    async def verify_identity(
        self,
        document_type: str,
        document_number: str,
        document_image_key: str,
        selfie_image_key: str,
        video_key: Optional[str] = None,
    ) -> IdentityVerificationResult:
        res = {
            "success": True,
            "reference_id": "7eb4b290-da51-4600-b1ca-9f31e720c20c",
            "raw_response": {
                "provider": "mock",
                "message": "Identity Verified successfully",
                "document_type": document_type,
                "document_number": document_number,
                "video_key": video_key,
                "document_image_key": document_image_key,
            },
            "requires_manual_review": True,
            "liveness_score": 85.0,
            "liveness_check_passed": True,
        }
        logger.info("MockIdentityVerificationProvider.verify_identity called")
        return IdentityVerificationResult(**res)



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
        return IdentityVerificationResult(**response.json())