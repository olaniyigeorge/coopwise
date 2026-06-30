"""
Redis-backed OtpStorePort implementation.

Owns code generation, TTL, one-time consumption, AND rate limiting — all
provider-agnostic, so swapping Termii for Africa's Talking, or picking
Resend for email, never touches this file.

Key design:
  otp:{channel}:{identifier}            -> the current code (TTL = CODE_TTL)
  otp:{channel}:{identifier}:attempts    -> failed verify attempt count (TTL = CODE_TTL)
  otp:ratelimit:{channel}:{identifier}   -> request count in the current window
"""
from __future__ import annotations

import secrets

from redis.asyncio.client import Redis

from src.domains.auth.exceptions import OtpRateLimitedError
from src.domains.auth.ports import OtpChannel

CODE_TTL_SECONDS = 600  # 10 minutes
CODE_LENGTH = 6
MAX_VERIFY_ATTEMPTS = 5  # per code, before forcing a re-request

RATE_LIMIT_WINDOW_SECONDS = 3600  # 1 hour
RATE_LIMIT_MAX_REQUESTS = 5  # OTP requests per identifier per window — tune once
# real SMS costs are known; this number directly bounds SMS spend exposure
# per identifier per hour and is the main defense against bill-drain abuse.


class RedisOtpStore:
    def __init__(self, redis: Redis) -> None:
        self._redis = redis

    def _code_key(self, channel: OtpChannel, identifier: str) -> str:
        return f"otp:{channel.value}:{identifier}"

    def _attempts_key(self, channel: OtpChannel, identifier: str) -> str:
        return f"otp:{channel.value}:{identifier}:attempts"

    def _rate_key(self, channel: OtpChannel, identifier: str) -> str:
        return f"otp:ratelimit:{channel.value}:{identifier}"

    async def issue_code(self, channel: OtpChannel, identifier: str) -> str:
        rate_key = self._rate_key(channel, identifier)
        current = await self._redis.incr(rate_key)
        if current == 1:
            await self._redis.expire(rate_key, RATE_LIMIT_WINDOW_SECONDS)
        if current > RATE_LIMIT_MAX_REQUESTS:
            raise OtpRateLimitedError(
                f"Too many OTP requests for this {channel.value}. Try again later."
            )

        code = "".join(secrets.choice("0123456789") for _ in range(CODE_LENGTH))
        code_key = self._code_key(channel, identifier)
        await self._redis.set(code_key, code, ex=CODE_TTL_SECONDS)
        await self._redis.delete(self._attempts_key(channel, identifier))
        return code

    async def verify_and_consume(
        self, channel: OtpChannel, identifier: str, code: str
    ) -> bool:
        code_key = self._code_key(channel, identifier)
        attempts_key = self._attempts_key(channel, identifier)

        attempts = await self._redis.incr(attempts_key)
        if attempts == 1:
            await self._redis.expire(attempts_key, CODE_TTL_SECONDS)
        if attempts > MAX_VERIFY_ATTEMPTS:
            # Burn the code so a brute-force run can't keep guessing against
            # it even within its remaining TTL.
            await self._redis.delete(code_key)
            return False

        stored = await self._redis.get(code_key)
        if stored is None:
            return False

        stored_str = stored.decode() if isinstance(stored, bytes) else stored
        # Constant-time-ish comparison isn't critical here (codes are
        # single-use, short-TTL, and rate/attempt limited), but cheap to do.
        if not secrets.compare_digest(stored_str, code):
            return False

        await self._redis.delete(code_key)
        await self._redis.delete(attempts_key)
        return True