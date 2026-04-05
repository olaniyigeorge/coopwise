"""OpenAI Chat Completions for CoopWise AI features."""

from __future__ import annotations

import asyncio
from typing import Optional

from openai import APIError, AsyncOpenAI, RateLimitError

from app.utils.logger import logger
from config import AppConfig as config


def _require_client() -> AsyncOpenAI:
    key = (config.OPENAI_API_KEY or "").strip()
    if not key:
        raise ValueError("OPENAI_API_KEY is not set in environment variables")
    return AsyncOpenAI(api_key=key)


async def openai_chat_completion(
    user_prompt: str,
    *,
    system_prompt: Optional[str] = None,
    max_tokens: int = 1024,
    temperature: float = 0.6,
) -> str:
    model = (config.OPENAI_CHAT_MODEL or "gpt-4o-mini").strip()
    messages: list[dict[str, str]] = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": user_prompt})

    client = _require_client()
    last_exc: Exception | None = None
    for attempt in range(3):
        try:
            resp = await client.chat.completions.create(
                model=model,
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature,
            )
            choice = resp.choices[0].message.content
            if not choice:
                raise RuntimeError("Empty response from OpenAI")
            return choice.strip()
        except RateLimitError as e:
            last_exc = e
            logger.warning("OpenAI rate limited (attempt %s): %s", attempt + 1, e)
            await asyncio.sleep(0.5 * (attempt + 1))
        except APIError as e:
            if getattr(e, "status_code", None) == 429:
                last_exc = e
                await asyncio.sleep(0.5 * (attempt + 1))
                continue
            logger.error("OpenAI API error: %s", e)
            raise RuntimeError("Failed to fetch AI response") from e
    raise RuntimeError("AI is rate limited") from last_exc
