"""Persist AI chat transcripts in Redis (TTL, capped length)."""

from __future__ import annotations

import json
from typing import Any

from redis import Redis

KEY_PREFIX = "coopwise:ai_chat:"
TTL_SECONDS = 7 * 24 * 3600  # 1 week
MAX_STORED_MESSAGES = 50


def _key(user_id: str) -> str:
    return f"{KEY_PREFIX}{user_id}"


def load_messages(redis: Redis, user_id: str) -> list[dict[str, Any]]:
    raw = redis.get(_key(user_id))
    if not raw:
        return []
    try:
        data = json.loads(raw.decode() if isinstance(raw, bytes) else raw)
        return data if isinstance(data, list) else []
    except (json.JSONDecodeError, TypeError):
        return []


def save_messages(redis: Redis, user_id: str, messages: list[dict[str, Any]]) -> None:
    trimmed = messages[-MAX_STORED_MESSAGES:] if len(messages) > MAX_STORED_MESSAGES else messages
    payload = json.dumps(trimmed)
    redis.setex(_key(user_id), TTL_SECONDS, payload)


def clear_messages(redis: Redis, user_id: str) -> None:
    redis.delete(_key(user_id))
