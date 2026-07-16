import asyncio
import uuid
from fastapi import Request, Response
from typing import Callable
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
import time
from src.shared.utils.logger import logger

import redis.asyncio as redis
from redis.asyncio.client import Redis as RedisClient

class DistributedTokenBucketMiddleware(BaseHTTPMiddleware):
    """
        Distributed token bucket rate limiter using Redis + Lua (atomic).
        - Uses millisecond timestamps for smooth refill.
        - Uses fractional tokens (floats) so refill works even during fast loops.
        - Handles Redis NOSCRIPT by reloading script automatically.
    """

    LUA_SCRIPT = r"""
        local key = KEYS[1]
        local capacity = tonumber(ARGV[1])
        local refill_rate = tonumber(ARGV[2])          -- tokens per second
        local now_ms = tonumber(ARGV[3])               -- current time in ms
        local requested = tonumber(ARGV[4])

        -- Read stored state
        local data = redis.call('HMGET', key, 'tokens', 'ts_ms')
        local tokens = tonumber(data[1])
        local ts_ms = tonumber(data[2])

        if tokens == nil or ts_ms == nil then
            tokens = capacity
            ts_ms = now_ms
        end

        -- Refill (fractional) based on elapsed milliseconds
        local delta_ms = math.max(0, now_ms - ts_ms)
        local refill = (delta_ms / 1000.0) * refill_rate
        tokens = math.min(capacity, tokens + refill)

        local allowed = 0
        if tokens >= requested then
            tokens = tokens - requested
            allowed = 1
        end

        -- Persist updated state every request
        redis.call('HMSET', key, 'tokens', tokens, 'ts_ms', now_ms)
        redis.call('EXPIRE', key, 3600)

        return {allowed, tokens}
    """

    def __init__(self, app: ASGIApp, rules: list[dict], default: dict):
        super().__init__(app)
        # sort longest-prefix-first so "/api/v1/kyc/identity" matches before "/api/v1"
        self.rules = sorted(rules, key=lambda r: -len(r["path_prefix"]))
        self.default = default
        self._script_sha: str | None = None
        self._script_lock = asyncio.Lock()

    def _resolve_rule(self, path: str) -> dict:
        for rule in self.rules:
            if path.startswith(rule["path_prefix"]):
                return rule
        return self.default

    async def _ensure_script(self, r):
        """
        Load Lua script into Redis and cache its SHA.
        Handles concurrent calls safely enough because script loading is idempotent.
        """
        if self._script_sha is not None:
            return

        async with self._script_lock:
            if self._script_sha is None:
                self._script_sha = await r.script_load(self.LUA_SCRIPT)

    def _get_client_id(self, request: Request) -> str:
        #TODO: Render's XFF handling isn't documented as strictly append-only for
        # all plan tiers — don't trust client-supplied values for a security
        # control. Revisit if/when Render ships a dedicated client-IP header
        xff = request.headers.get("x-forwarded-for")
        client_ip = xff.split(",")[0].strip() if xff else (request.client.host if request.client else "unknown")
        return client_ip

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        r = getattr(request.app.state, "redis", None)
        if r is None:
            logger.error("Redis client not found in app.state.redis. Rate limiting disabled.")
            return await call_next(request)

        rule = self._resolve_rule(request.url.path)
        capacity = float(rule["capacity"])
        refill_rate = float(rule["refill_rate"])

        client_id = self._get_client_id(request)
        # keyed by rule's path_prefix, not just client — so a user's KYC
        # bucket and their general API bucket are independent
        key = f"rate-limit:{rule.get('path_prefix', 'default')}:{client_id}"

        now_ms = int(time.time() * 1000)
        try:
            await self._ensure_script(r)
            result = await self._eval(r, key, capacity, refill_rate, now_ms)
            allowed, tokens_left = bool(result[0]), float(result[1])

            if allowed:
                response = await call_next(request)
                response.headers["X-RateLimit-Limit"] = str(int(capacity))
                response.headers["X-RateLimit-Remaining"] = str(max(0, int(tokens_left)))
                return response

            retry_after = self._retry_after_seconds(tokens_left, refill_rate)
            logger.warning("Rate limit exceeded for '%s' on rule '%s' (tokens_left=%.3f)",
                            client_id, rule.get("path_prefix"), tokens_left)
            return Response(
                content="Too Many Requests", status_code=429,
                headers={"Retry-After": str(retry_after), "X-RateLimit-Limit": str(int(capacity)),
                         "X-RateLimit-Remaining": "0"},
            )
        except Exception as e:
            logger.error("Rate limiter error: %s. Allowing request.", e)
            return await call_next(request)

    async def _eval(self, r, key, capacity, refill_rate, now_ms):
        try:
            return await r.evalsha(self._script_sha, 1, key, str(capacity), str(refill_rate), str(now_ms), "1")
        except Exception as e:
            if "NOSCRIPT" in str(e).upper():
                self._script_sha = None
                await self._ensure_script(r)
                return await r.evalsha(self._script_sha, 1, key, str(capacity), str(refill_rate), str(now_ms), "1")
            raise

    def _retry_after_seconds(self, tokens_left: float, refill_rate: float) -> int:
        if refill_rate <= 0:
            return 1
        missing = max(0.0, 1.0 - tokens_left)
        return max(1, int(missing / refill_rate + 0.999))



async def app_middleware(request: Request, call_next):
    request_id = str(uuid.uuid4())
    logger.info(f"\nStart Request {request_id}: {request.method} {request.url.path}\n")
    
    start_time = time.time()
    response = await call_next(request)
    req_process_time = round((time.time() - start_time) * 1000, 3)  # in ms

    log_dict = {
        "request_id": request_id,
        "url": request.url.path,
        "method": request.method,
        "status_code": response.status_code,
        "req_process_time": f"{req_process_time}ms",
    }
    logger.info(log_dict, extra=log_dict)
    logger.info(f"\nEnd Request {request_id}: {response.status_code}\n")
    return response






