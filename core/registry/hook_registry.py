from __future__ import annotations

from collections.abc import Callable

_hook_registry: dict[str, Callable] = {}


def register_hook(name: str):
    """Decorator that registers a callable as a named hook.

    Registered hooks can be referenced by name in ``OperationContext.hook_names``
    and survive serialisation through Celery's JSON transport.
    """
    def decorator(fn: Callable) -> Callable:
        _hook_registry[name] = fn
        return fn
    return decorator


def resolve_hook_names(names: list[str] | None, hook_cls: type | None = None) -> object | None:
    """Convert a list of registered hook names into a ``BulkHooks`` instance.

    *hook_cls* defaults to ``BulkHooks`` but is imported lazily to avoid
    circular imports at module load time.
    """
    if not names:
        return None
    kwargs: dict[str, Callable] = {}
    for name in names:
        fn = _hook_registry.get(name)
        if fn is not None:
            kwargs[name] = fn
    if not kwargs:
        return None
    if hook_cls is None:
        from core.admin.helpers.bulk_helpers import BulkHooks as hook_cls
    return hook_cls(**kwargs)


__all__ = [
    "register_hook",
    "resolve_hook_names",
]
