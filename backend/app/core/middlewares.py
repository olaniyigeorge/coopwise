import uuid
from fastapi import Request, Response
from typing import Callable
import json
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
import time
from app.utils.logger import logger

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

    def __init__(self, app: ASGIApp, capacity: int, refill_rate: float):
        super().__init__(app)
        self.capacity = float(capacity)
        self.refill_rate = float(refill_rate)
        self._script_sha: str | None = None

    async def _ensure_script(self, r: RedisClient) -> None:
        if self._script_sha is None:
            self._script_sha = await r.script_load(self.LUA_SCRIPT)
            logger.info("Rate limiter Lua script loaded (sha=%s)", self._script_sha)

    def _get_client_id(self, request: Request) -> str:
        # Prefer X-Forwarded-For (first IP), else socket IP
        xff = request.headers.get("x-forwarded-for")
        if xff:
            client_ip = xff.split(",")[0].strip()
        else:
            client_ip = request.client.host if request.client else "unknown"

        # Optional: make rate limit per route:
        # return f"{client_ip}:{request.method}:{request.url.path}"
        return client_ip

    def _retry_after_seconds(self, tokens_left: float) -> int:
        # If blocked, how long until 1 token is available?
        # tokens_left is < 1 in blocked scenario (or < requested).
        if self.refill_rate <= 0:
            return 1
        missing = max(0.0, 1.0 - tokens_left)
        seconds = missing / self.refill_rate
        return max(1, int(seconds + 0.999))  # ceil, min 1

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        r: RedisClient | None = getattr(request.app.state, "redis", None)
        if r is None:
            logger.error("Redis client not found in app.state.redis. Rate limiting disabled.")
            return await call_next(request)

        client_id = self._get_client_id(request)
        key = f"rate-limit:{client_id}"

        now_ms = int(time.time() * 1000)

        try:
            await self._ensure_script(r)

            try:
                result = await r.evalsha(
                    self._script_sha,
                    1,
                    key,
                    str(self.capacity),
                    str(self.refill_rate),
                    str(now_ms),
                    "1",
                )
            except Exception as e:
                # Redis restarted or script cache flushed -> NOSCRIPT
                if "NOSCRIPT" in str(e).upper():
                    self._script_sha = None
                    await self._ensure_script(r)
                    result = await r.evalsha(
                        self._script_sha,
                        1,
                        key,
                        str(self.capacity),
                        str(self.refill_rate),
                        str(now_ms),
                        "1",
                    )
                else:
                    raise

            allowed = bool(result[0])
            tokens_left = float(result[1])

            if allowed:
                response = await call_next(request)
                response.headers["X-RateLimit-Limit"] = str(int(self.capacity))
                response.headers["X-RateLimit-Remaining"] = str(max(0, int(tokens_left)))
                return response

            retry_after = self._retry_after_seconds(tokens_left)
            logger.warning("Rate limit exceeded for client '%s' (tokens_left=%.3f)", client_id, tokens_left)
            return Response(
                content="Too Many Requests",
                status_code=429,
                headers={
                    "Retry-After": str(retry_after),
                    "X-RateLimit-Limit": str(int(self.capacity)),
                    "X-RateLimit-Remaining": "0",
                },
            )

        except Exception as e:
            logger.error("Rate limiter error: %s. Allowing request.", e)
            return await call_next(request)



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






