import hashlib
import json
from django.core.cache import cache
from typing import Any


def _tenant_scope_token() -> str:
    """Tenant dimension for cache keys so one user's scope never leaks across tenants."""
    try:
        from core.admin.utils.context import RequestContext

        cid = RequestContext.get_company_id() or "-"
        buid = RequestContext.get_business_unit_id() or "-"
        brid = RequestContext.get_branch_id() or "-"
        return f"{cid}:{buid}:{brid}"
    except Exception:
        return "-:-:-"


def _object_hash(user_id: Any, model_name: str, pk: Any) -> str:
    """Stable identity for a user-scoped object within the current tenant."""
    token = f"{user_id}:{_tenant_scope_token()}:{model_name}:{pk}:"
    return hashlib.md5(token.encode()).hexdigest()


def _index_key(obj_hash: str) -> str:
    return f"api_cache:index:{obj_hash}"


def get_serializer_cache_key(user_id: Any, model_name: str, pk: Any, fields: Any = None) -> str:
    """
    Generate a stable cache key for a serialized object.
    Scoped to the requesting user, tenant, and field selection.
    """
    fields_str = json.dumps(sorted(fields)) if fields else "all"
    variant = hashlib.md5(f"fields:{fields_str}".encode()).hexdigest()
    return f"api_cache:{_object_hash(user_id, model_name, pk)}:{variant}"


def get_cached_serializer_data(key: str) -> Any | None:
    return cache.get(key)


def set_cached_serializer_data(key: str, data: Any, timeout: int = 300):
    """
    Cache serialized data for a specific period (default 5 mins).
    Registers the key in a per-object index so invalidation can sweep every field variant.
    """
    cache.set(key, data, timeout)
    parts = key.split(":")
    if len(parts) == 3 and parts[0] == "api_cache":
        index_key = _index_key(parts[1])
        keys = cache.get(index_key) or []
        if key not in keys:
            keys.append(key)
            cache.set(index_key, keys, timeout)


def invalidate_serializer_cache(user_id: Any, model_name: str, pk: Any):
    """
    Invalidate all cache variants for a specific object across all field selections.
    """
    index_key = _index_key(_object_hash(user_id, model_name, pk))
    keys = cache.get(index_key) or []
    if keys:
        cache.delete_many(keys)
    cache.delete(index_key)


# --- Metadata (Rules) Caching ---

def get_metadata_cache_key(model_name: str, context: str = "default") -> str:
    """
    Key for storing flattened model rules in Redis.
    """
    return f"metadata:rules:{model_name}:{context}"


def get_cached_metadata(key: str) -> dict | None:
    return cache.get(key)


def set_cached_metadata(key: str, data: dict, timeout: int = 3600):
    """
    Cache metadata for 1 hour by default.
    """
    cache.set(key, data, timeout)