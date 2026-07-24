"""
Metro Cardz — Redis-backed Rate Limiting
Protects auth endpoints from brute-force attacks.
"""
import time
from typing import Callable
from fastapi import Request, HTTPException, status
import redis as redis_lib

from app.core.config import settings

# Module-level Redis client (connection pool reused across requests)
_redis_client: redis_lib.Redis | None = None


def get_redis() -> redis_lib.Redis:
    global _redis_client
    if _redis_client is None:
        _redis_client = redis_lib.from_url(
            settings.redis_url,
            decode_responses=True,
            socket_connect_timeout=3,
            socket_timeout=3,
        )
    return _redis_client


class RateLimiter:
    """
    Sliding-window rate limiter using Redis.
    Example: RateLimiter(max_requests=5, window_seconds=60)
    → max 5 requests per IP per 60 seconds
    """

    def __init__(self, max_requests: int, window_seconds: int, key_prefix: str = "rl"):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.key_prefix = key_prefix

    def __call__(self, request: Request) -> None:
        if settings.environment == "testing":
            return

        client_ip = request.client.host if request.client else "unknown"
        key = f"{self.key_prefix}:{client_ip}"

        try:
            r = get_redis()
            pipe = r.pipeline()
            now = time.time()
            window_start = now - self.window_seconds

            pipe.zremrangebyscore(key, 0, window_start)
            pipe.zadd(key, {str(now): now})
            pipe.zcard(key)
            pipe.expire(key, self.window_seconds)
            results = pipe.execute()

            request_count = results[2]
            if request_count > self.max_requests:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Too many requests. Limit: {self.max_requests} per {self.window_seconds}s",
                    headers={"Retry-After": str(self.window_seconds)},
                )
        except HTTPException:
            raise
        except Exception:
            # If Redis is down, don't block the request — fail open (graceful degradation)
            pass


# Pre-built limiter instances for different endpoint types
auth_rate_limit = RateLimiter(max_requests=10, window_seconds=60, key_prefix="rl:auth")
otp_rate_limit = RateLimiter(max_requests=3, window_seconds=60, key_prefix="rl:otp")
public_rate_limit = RateLimiter(max_requests=30, window_seconds=60, key_prefix="rl:pub")
# Stricter limiter for the membership-number + last-4-digits lookup.
# Membership numbers are sequential/guessable (SAL001, SAL002...) — unlike the
# opaque QR public_token. 10 attempts per hour per IP prevents brute-forcing
# the last-4-digit check while still being generous for legitimate customers.
membership_lookup_rate_limit = RateLimiter(max_requests=10, window_seconds=3600, key_prefix="rl:memlookup")
