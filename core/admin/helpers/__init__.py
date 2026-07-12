"""Barrel file for ``core.admin.helpers``.

**Deprecated**: Prefer direct submodule imports instead of importing from this
barrel.  For example::

    from core.admin.helpers.response_helpers import ResponseFactory

instead of::

    from core.admin.helpers import ResponseFactory

All names are still accessible for backwards compatibility but will emit a
``DeprecationWarning``.
"""

import warnings
from importlib import import_module

__all__ = [
    "BATCH_MODE_ALL_OR_NOTHING",
    "BATCH_MODE_BEST_EFFORT",
    "BackgroundTaskMixin",
    "BatchOperation",
    "BulkHooks",
    "BulkResult",
    "ModelInstanceBuilder",
    "OperationContext",
    "batch_process",
    "build_batch_response",
    "bulk_create",
    "bulk_delete",
    "bulk_update",
    "filter_queryset",
    "get_display_name",
    "get_field_choices",
    "get_object_with_scoping",
    "get_related_fields_from_serializer",
    "identity_aware",
    "IndustrialCursorPagination",
    "optimize_queryset_with_serializer",
    "paginate_queryset",
    "register_hook",
    "resolve_hook_names",
    "ResponseFactory",
    "RuleSelector",
    "should_offload",
    "StandardResultsSetPagination",
    "TaskStatus",
    "ValidationMediator",
]

# name → submodule path (relative to this package)
_SUBMODULES = {
    "BATCH_MODE_ALL_OR_NOTHING": "batch_helpers",
    "BATCH_MODE_BEST_EFFORT": "batch_helpers",
    "BackgroundTaskMixin": "task_helpers",
    "BatchOperation": "batch_helpers",
    "BulkHooks": "bulk_helpers",
    "BulkResult": "bulk_helpers",
    "ModelInstanceBuilder": "builder_helpers",
    "OperationContext": "bulk_helpers",
    "batch_process": "batch_helpers",
    "build_batch_response": "batch_helpers",
    "bulk_create": "bulk_helpers",
    "bulk_delete": "bulk_helpers",
    "bulk_update": "bulk_helpers",
    "filter_queryset": "query_helpers",
    "get_display_name": "display_helpers",
    "get_field_choices": "choices_helpers",
    "get_object_with_scoping": "model_helpers",
    "get_related_fields_from_serializer": "serializer_helpers",
    "identity_aware": "identity_helpers",
    "IndustrialCursorPagination": "pagination_helpers",
    "optimize_queryset_with_serializer": "serializer_helpers",
    "paginate_queryset": "pagination_helpers",
    "register_hook": "bulk_helpers",
    "resolve_hook_names": "bulk_helpers",
    "ResponseFactory": "response_helpers",
    "RuleSelector": "rule_selector",
    "should_offload": "bulk_helpers",
    "StandardResultsSetPagination": "pagination_helpers",
    "TaskStatus": "task_helpers",
    "ValidationMediator": "mediator_helpers",
}


def __getattr__(name):
    if name not in _SUBMODULES:
        raise AttributeError(f"module {__name__!r} has no attribute {name!r}")

    warnings.warn(
        f"Import '{name}' from barrel ({__name__}) is deprecated. "
        f"Use 'from {__name__}.{_SUBMODULES[name]} import {name}' instead.",
        DeprecationWarning,
        stacklevel=2,
    )
    mod = import_module(f".{_SUBMODULES[name]}", package=__name__)
    return getattr(mod, name)
