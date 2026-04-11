"""Limite de taxa por IP em POST /v1/auth/login e atraso constante em falha (mitigação a força bruta / timing)."""

from __future__ import annotations

import asyncio
import time
from collections import defaultdict
from threading import Lock

from fastapi import HTTPException, Request, status

# Por instância do processo; atrás de load balancer com múltiplas réplicas use rate limit na borda (Nginx) ou Redis.
_MAX_LOGIN_PER_MINUTE_PER_IP = 20
_FAIL_DELAY_SEC = 0.4

_lock = Lock()
_buckets: dict[str, list[float]] = defaultdict(list)


def client_ip(request: Request) -> str:
    xff = request.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[0].strip()[:200]
    if request.client:
        return request.client.host
    return "unknown"


def check_login_rate_limit(request: Request) -> None:
    ip = client_ip(request)
    now = time.monotonic()
    with _lock:
        bucket = _buckets[ip]
        bucket[:] = [t for t in bucket if now - t < 60]
        if len(bucket) >= _MAX_LOGIN_PER_MINUTE_PER_IP:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Muitas tentativas de login. Aguarde um minuto e tente novamente.",
            )
        bucket.append(now)


async def delay_on_auth_failure() -> None:
    await asyncio.sleep(_FAIL_DELAY_SEC)
