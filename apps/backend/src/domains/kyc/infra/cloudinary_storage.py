from __future__ import annotations

import asyncio
from io import BytesIO

import cloudinary
import cloudinary.uploader

from config import AppConfig as config
from src.domains.kyc.ports import ObjectStoragePort


class CloudinaryStorage(ObjectStoragePort):
    def __init__(self, url: str | None = None) -> None:
        cloudinary.config(
            cloudinary_url=url or config.CLOUDINARY_URL,
            secure=True,
        )

    async def upload(
        self,
        key: str,
        content: bytes,
        content_type: str,
    ) -> str:
        """
        Upload a file to Cloudinary.

        Args:
            key: Public identifier for the uploaded asset.
            content: Raw file bytes.
            content_type: MIME type (e.g. image/jpeg, application/pdf).

        Returns:
            The secure URL of the uploaded asset.
        """

        file = BytesIO(content)

        result = await asyncio.to_thread(
            cloudinary.uploader.upload,
            file,
            public_id=key,
            resource_type="auto",
            overwrite=True,
            invalidate=True,
            unique_filename=False,
        )

        return result["secure_url"]