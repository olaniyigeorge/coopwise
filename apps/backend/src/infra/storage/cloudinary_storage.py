from __future__ import annotations

import asyncio
from io import BytesIO
from urllib.parse import urlparse

import cloudinary.uploader

from config import AppConfig as config
from src.domains.kyc.ports import ObjectStoragePort


def _parse_cloudinary_url(url: str) -> dict:
    """cloudinary://<api_key>:<api_secret>@<cloud_name>"""
    parsed = urlparse(url)
    return {
        "cloud_name": parsed.hostname,
        "api_key": parsed.username,
        "api_secret": parsed.password,
    }


def configure_cloudinary() -> None:
    if not config.CLOUDINARY_URL:
        raise RuntimeError("CLOUDINARY_URL is not set")
    # Still fine to call for any code path that uploads on the main thread,
    # but no longer relied on for correctness inside to_thread calls.
    cloudinary.config(cloudinary_url=config.CLOUDINARY_URL, secure=True)


class CloudinaryStorage(ObjectStoragePort):
    def __init__(self, url: str | None = None) -> None:
        self._credentials = _parse_cloudinary_url(url or config.CLOUDINARY_URL)

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
            secure=True,
            **self._credentials,
        )

        return result["secure_url"]