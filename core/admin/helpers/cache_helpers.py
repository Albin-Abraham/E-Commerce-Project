import hashlib
import json
from django.core.cache import cache
from typing import Any


def get_serializer_cache_key(user_id: Any, model_name: str, pk: Any, fields: Any = None) -> str:
    """
    Generate a stable cache key for a serialized object.
    """
    fields_str = json.dumps(sorted(fields)) if fields else "all"
    token = f"{user_id}:{model_name}:{pk}:{fields_str}"
    return f"api_cache:{hashlib.md5(token.encode()).hexdigest()}"


def get_cached_serializer_data(key: str) -> Any | None:
    try:
        return cache.get(key)
    except Exception:
        return None


def set_cached_serializer_data(key: str, data: Any, timeout: int = 300):
    """
    Cache serialized data for a specific period (default 5 mins).
    """
    try:
        cache.set(key, data, timeout)
    except Exception:
        pass


def invalidate_serializer_cache(user_id: Any, model_name: str, pk: Any):
    """
    Invalidate all cache variants for a specific object across all field selections.
    """
    try:
        prefix = f"api_cache:{hashlib.md5(f'{user_id}:{model_name}:{pk}:'.encode()).hexdigest()[:24]}"
        # Django cache doesn't support key pattern deletion, so delete the common keys
        for fields_combo in [None, "all"]:
            key = get_serializer_cache_key(user_id, model_name, pk, fields_combo)
            cache.delete(key)
    except Exception:
        pass


# --- Metadata (Rules) Caching ---

def get_metadata_cache_key(model_name: str, context: str = "default") -> str:
    """
    Key for storing flattened model rules in Redis.
    """
    return f"metadata:rules:{model_name}:{context}"


def get_cached_metadata(key: str) -> dict | None:
    try:
        return cache.get(key)
    except Exception:
        return None


def set_cached_metadata(key: str, data: dict, timeout: int = 3600):
    """
    Cache metadata for 1 hour by default.
    """
    try:
        cache.set(key, data, timeout)
    except Exception:
        pass

