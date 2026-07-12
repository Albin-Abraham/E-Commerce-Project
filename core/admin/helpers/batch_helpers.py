from __future__ import annotations

import logging
from collections import ChainMap
from collections.abc import Callable
from dataclasses import dataclass, field
from typing import Any

from django.db import transaction

from core.admin.helpers.bulk_helpers import (
    BulkHooks,
    BulkResult,
    OperationContext,
    inject_tenant_context,
)

logger = logging.getLogger(__name__)

__all__ = [
    "BATCH_MODE_ALL_OR_NOTHING",
    "BATCH_MODE_BEST_EFFORT",
    "BatchOperation",
    "batch_process",
    "build_batch_response",
]


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

BATCH_MODE_ALL_OR_NOTHING = "all_or_nothing"
BATCH_MODE_BEST_EFFORT = "best_effort"


# ---------------------------------------------------------------------------
# Public types
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class BatchOperation:
    action: str  # "create" | "update" | "delete"
    data: dict
    context_override: dict | None = None


# ---------------------------------------------------------------------------
# Internal dispatch registry
# ---------------------------------------------------------------------------


def _batch_create_one(data: dict, context: OperationContext) -> BulkResult:
    if context.serializer_class is None or context.serializer_context is None:
        return BulkResult(success=False, errors=["OperationContext.serializer_class and serializer_context required for create"])

    data = inject_tenant_context(data, context.model, is_many=False)

    if context.hooks and context.hooks.pre_create:
        data = context.hooks.pre_create(data)

    serializer = context.serializer_class(
        data=data, context=context.serializer_context
    )
    if not serializer.is_valid():
        return BulkResult(success=False, errors=serializer.errors)

    try:
        with transaction.atomic():
            if context.hooks and context.hooks.perform_create:
                instance = context.hooks.perform_create(serializer)
            else:
                instance = serializer.save()
            if context.hooks and context.hooks.post_create:
                context.hooks.post_create(instance)

        return BulkResult(success=True, instances=[instance], data=serializer.data)
    except Exception as e:
        logger.exception("Batch create failed")
        return BulkResult(success=False, errors=[str(e)])


def _batch_update_one(data: dict, context: OperationContext) -> BulkResult:
    if context.serializer_class is None or context.serializer_context is None:
        return BulkResult(success=False, errors=["OperationContext.serializer_class and serializer_context required for update"])

    pk = data.get("id") or data.get("pk")
    if not pk:
        return BulkResult(success=False, errors=["Missing id/pk"])

    get_object_fn = context.get_object_fn
    if get_object_fn:
        obj = get_object_fn(pk)
    else:
        try:
            obj = context.model.objects.get(pk=pk)
        except context.model.DoesNotExist:
            return BulkResult(success=False, errors=["Not found"])

    if context.hooks and context.hooks.pre_update:
        data = context.hooks.pre_update(obj, data)

    serializer = context.serializer_class(
        obj, data=data, partial=True, context=context.serializer_context
    )
    if not serializer.is_valid():
        return BulkResult(success=False, errors=serializer.errors)

    try:
        with transaction.atomic():
            if context.hooks and context.hooks.perform_update:
                instance = context.hooks.perform_update(serializer)
            else:
                instance = serializer.save()
            if context.hooks and context.hooks.post_update:
                context.hooks.post_update(instance)

        return BulkResult(success=True, instances=[instance], data=serializer.data)
    except Exception as e:
        logger.exception("Batch update failed")
        return BulkResult(success=False, errors=[str(e)])


def _batch_delete_one(data: dict, context: OperationContext) -> BulkResult:
    pk = data.get("id") or data.get("pk")
    if not pk:
        return BulkResult(success=False, errors=["Missing id/pk"])

    get_object_fn = context.get_object_fn
    if get_object_fn:
        obj = get_object_fn(pk)
    else:
        try:
            obj = context.model.objects.get(pk=pk)
        except context.model.DoesNotExist:
            return BulkResult(success=False, errors=["Not found"])

    if not obj:
        return BulkResult(success=False, errors=["Not found"])

    try:
        with transaction.atomic():
            if context.hooks and context.hooks.pre_delete:
                context.hooks.pre_delete(obj)
            if context.hooks and context.hooks.perform_destroy:
                context.hooks.perform_destroy(obj)
            elif context.supports_soft_delete and hasattr(obj, "soft_delete"):
                obj.soft_delete()
            else:
                obj.delete()
            if context.hooks and context.hooks.post_delete:
                context.hooks.post_delete(obj)

        return BulkResult(success=True, data={"id": str(pk)})
    except Exception as e:
        logger.exception("Batch delete failed")
        return BulkResult(success=False, errors=[str(e)])


_BATCH_DISPATCH: dict[str, Callable[[dict, OperationContext], BulkResult]] = {
    "create": _batch_create_one,
    "update": _batch_update_one,
    "delete": _batch_delete_one,
}


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def batch_process(
    operations: list[BatchOperation | dict],
    context: OperationContext,
    *,
    mode: str = BATCH_MODE_ALL_OR_NOTHING,
) -> list[BulkResult]:
    if not operations:
        return []

    results: list[BulkResult] = []
    aborted = False

    for idx, op in enumerate(operations):
        if aborted:
            results.append(
                BulkResult(success=False, errors=["Skipped — batch aborted"])
            )
            continue

        if isinstance(op, dict):
            op = BatchOperation(
                action=op.get("action", "").strip().lower(),
                data=op.get("data", {}),
                context_override=op.get("context_override"),
            )

        handler = _BATCH_DISPATCH.get(op.action)
        if handler is None:
            result = BulkResult(
                success=False,
                errors=[f"Unsupported action '{op.action}'"],
            )
            results.append(result)
            if mode == BATCH_MODE_ALL_OR_NOTHING:
                aborted = True
            continue

        # Merge per-operation context overrides via ChainMap
        op_context = _merge_context(context, op.context_override) if op.context_override else context

        try:
            with transaction.atomic():
                result = handler(op.data, op_context)
                if not result.success and mode == BATCH_MODE_ALL_OR_NOTHING:
                    aborted = True
            results.append(result)
        except Exception as e:
            logger.exception(f"Batch operation {idx} raised unexpectedly")
            result = BulkResult(success=False, errors=[str(e)])
            results.append(result)
            if mode == BATCH_MODE_ALL_OR_NOTHING:
                aborted = True

    return results


def _merge_context(
    base: OperationContext, overrides: dict
) -> OperationContext:
    """Return a new OperationContext with overrides merged via ChainMap."""
    merged_ser_ctx = ChainMap(
        overrides.get("serializer_context", {}),
        base.serializer_context,
    )
    return OperationContext(
        model=overrides.get("model", base.model),
        serializer_class=overrides.get("serializer_class", base.serializer_class),
        serializer_context=merged_ser_ctx,  # type: ignore[arg-type]
        hooks=overrides.get("hooks", base.hooks),
        get_object_fn=overrides.get("get_object_fn", base.get_object_fn),
        supports_soft_delete=overrides.get(
            "supports_soft_delete", base.supports_soft_delete
        ),
    )


# ---------------------------------------------------------------------------
# View-ready response builder
# ---------------------------------------------------------------------------


def build_batch_response(
    operations: list[BatchOperation | dict],
    context: OperationContext,
    *,
    mode: str = BATCH_MODE_ALL_OR_NOTHING,
):
    from core.admin.helpers.response_helpers import ResponseFactory

    results = batch_process(operations, context, mode=mode)
    all_ok = all(r.success for r in results)

    if all_ok:
        return ResponseFactory.success(
            message="Batch operation completed",
            data={
                "results": [
                    {
                        "success": r.success,
                        "data": r.data,
                    }
                    for r in results
                ]
            },
        )

    return ResponseFactory.error(
        message="Batch operation completed with errors",
        details={
            "results": [
                {
                    "success": r.success,
                    "data": r.data,
                    "error": r.errors[0] if r.errors else None,
                }
                for r in results
            ]
        },
    )
