import json
from typing import Any, Optional

import redis

from .settings import settings


_redis_client: Optional[redis.Redis] = None


def get_redis() -> redis.Redis:
    global _redis_client
    if _redis_client is None:
        _redis_client = redis.Redis.from_url(settings.redis_url, decode_responses=True)
    return _redis_client


def cache_get(key: str) -> Optional[Any]:
    client = get_redis()
    try:
        payload = client.get(key)
    except redis.RedisError:
        return None
    if payload is None:
        return None
    try:
        return json.loads(payload)
    except json.JSONDecodeError:
        return None


def cache_set(key: str, value: Any, ttl_seconds: int = 30) -> None:
    client = get_redis()
    try:
        client.set(key, json.dumps(value), ex=ttl_seconds)
    except redis.RedisError:
        return


def cache_delete(pattern: str) -> None:
    client = get_redis()
    try:
        for key in client.scan_iter(match=pattern):
            client.delete(key)
    except redis.RedisError:
        return
