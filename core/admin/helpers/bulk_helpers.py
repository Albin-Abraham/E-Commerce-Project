from __future__ import annotations

import logging
from collections import defaultdict
from collections.abc import Callable
from dataclasses import dataclass, field
from typing import Any, Type

from django.conf import settings
from django.db import transaction
from django.db.models import Model

from core.admin.utils.context import RequestContext

logger = logging.getLogger(__name__)

from core.registry import register_hook, resolve_hook_names

__all__ = [
    "BulkHooks",
    "BulkResult",
    "OperationContext",
    "bulk_create",
    "bulk_delete",
    "bulk_update",
    "inject_tenant_context",
    "register_hook",
    "resolve_hook_names",
    "should_offload",
]


# ---------------------------------------------------------------------------
# Default hooks – safe to run in both sync and Celery-worker paths.
# They only fire when the model instance exposes create_audit_log.
# ---------------------------------------------------------------------------

@register_hook("post_create")
def _post_create_hook(instance):
    if hasattr(instance, "create_audit_log"):
        instance.create_audit_log("create")


@register_hook("post_update")
def _post_update_hook(instance):
    if hasattr(instance, "create_audit_log"):
        instance.create_audit_log("update")


# ---------------------------------------------------------------------------
# Public types
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class BulkHooks:
    pre_create: Callable[[Any], Any] | None = None
    post_create: Callable[[Any], None] | None = None
    perform_create: Callable[[Any], Any] | None = None
    pre_update: Callable[[Any, Any], Any] | None = None
    post_update: Callable[[Any], None] | None = None
    perform_update: Callable[[Any], Any] | None = None
    pre_delete: Callable[[Any], None] | None = None
    post_delete: Callable[[Any], None] | None = None
    perform_destroy: Callable[[Any], None] | None = None


@dataclass(frozen=True)
class OperationContext:
    model: Type[Model] | None = None
    serializer_class: Type | None = None
    serializer_context: dict | None = None
    hooks: BulkHooks | None = None
    get_object_fn: Callable | None = None
    supports_soft_delete: bool = True

    # Serialized fields for Celery transport
    model_label: str | None = None
    serializer_path: str | None = None
    company_id: str | None = None
    branch_id: str | None = None
    hook_names: list[str] | None = None  # hook names for Celery worker resolution

    def to_dict(self) -> dict:
        if self.model is None and self.model_label is None:
            raise ValueError("OperationContext needs model or model_label for serialization")
        ser_ctx = dict(self.serializer_context or {})
        ser_ctx.pop("request", None)
        
        return {
            "model_label": self.model_label or self.model._meta.label,
            "serializer_path": (
                self.serializer_path
                or (
                    f"{self.serializer_class.__module__}.{self.serializer_class.__qualname__}"
                    if self.serializer_class
                    else None
                )
            ),
            "serializer_context": ser_ctx,
            "supports_soft_delete": self.supports_soft_delete,
            "company_id": self.company_id,
            "branch_id": self.branch_id,
            "hook_names": self.hook_names,
        }

    @classmethod
    def from_dict(cls, d: dict) -> OperationContext:
        from django.apps import apps
        from importlib import import_module

        model = apps.get_model(d["model_label"])
        serializer_class = None
        ser_path = d.get("serializer_path")
        if ser_path:
            mod_path, cls_name = ser_path.rsplit(".", 1)
            serializer_class = getattr(import_module(mod_path), cls_name)

        hook_names = d.get("hook_names")
        hooks = resolve_hook_names(hook_names) if hook_names else None

        return cls(
            model=model,
            model_label=d["model_label"],
            serializer_class=serializer_class,
            serializer_path=ser_path,
            serializer_context=d.get("serializer_context", {}),
            hooks=hooks,
            hook_names=hook_names,
            supports_soft_delete=d.get("supports_soft_delete", True),
            company_id=d.get("company_id"),
            branch_id=d.get("branch_id"),
        )


@dataclass(frozen=True)
class BulkResult:
    success: bool
    instances: list | None = None
    data: Any = None
    errors: list | None = None
    meta: dict | None = None


# ---------------------------------------------------------------------------
# Utilities
# ---------------------------------------------------------------------------


def should_offload(data: Any, threshold: int | None = None) -> bool:
    if threshold is None:
        threshold = getattr(settings, "BULK_OPERATION_THRESHOLD", 50)
    is_many = isinstance(data, list)
    count = len(data) if is_many else 1
    return count >= threshold


def inject_tenant_context(
    data: Any,
    model: Type[Model] | None,
    *,
    is_many: bool = False,
    company_id: str | None = None,
    branch_id: str | None = None,
) -> Any:
    if company_id is None:
        company_id = RequestContext.get_company_id()
    if branch_id is None:
        branch_id = RequestContext.get_branch_id()

    if not company_id and not branch_id:
        return data

    has_company = company_id and model is not None and hasattr(model, "company")
    has_branch = branch_id and model is not None and hasattr(model, "branch")

    if not has_company and not has_branch:
        return data

    if is_many and isinstance(data, list):
        for item in data:
            if isinstance(item, dict):
                if has_company and not (item.get("company") or item.get("company_id")):
                    item["company"] = company_id
                if has_branch and not (item.get("branch") or item.get("branch_id")):
                    item["branch"] = branch_id
    elif isinstance(data, dict):
        if has_company and not (data.get("company") or data.get("company_id")):
            data["company"] = company_id
        if has_branch and not (data.get("branch") or data.get("branch_id")):
            data["branch"] = branch_id

    return data


# ---------------------------------------------------------------------------
# Core operations
# ---------------------------------------------------------------------------


def bulk_create(
    data: Any,
    context: OperationContext,
) -> BulkResult:
    if context.serializer_class is None:
        return BulkResult(success=False, errors=["OperationContext.serializer_class is required for create"])
    if context.serializer_context is None:
        return BulkResult(success=False, errors=["OperationContext.serializer_context is required for create"])

    is_many = isinstance(data, list)
    hooks = context.hooks

    data = inject_tenant_context(
        data, context.model,
        is_many=is_many,
        company_id=context.company_id,
        branch_id=context.branch_id,
    )

    if hooks and hooks.pre_create:
        if is_many:
            data = [hooks.pre_create(item) for item in data]
        else:
            data = hooks.pre_create(data)

    explain_mode = context.serializer_context.get("explain", False)

    serializer = context.serializer_class(
        data=data, many=is_many, context=context.serializer_context
    )
    if not serializer.is_valid():
        return BulkResult(success=False, errors=serializer.errors)

    try:
        with transaction.atomic():
            if hooks and hooks.perform_create:
                instances = hooks.perform_create(serializer)
            else:
                instances = serializer.save()

            if hooks and hooks.post_create:
                if is_many:
                    for inst in instances:
                        hooks.post_create(inst)
                else:
                    hooks.post_create(instances)

        meta: dict[str, Any] | None = None
        if explain_mode:
            trace = []
            if is_many:
                for inst in instances:
                    trace.append(getattr(inst, "_selector_trace", []))
            else:
                trace = getattr(instances, "_selector_trace", [])
            meta = {"validation_trace": trace}

        return BulkResult(
            success=True,
            instances=instances if is_many else [instances],
            data=serializer.data,
            meta=meta,
        )

    except Exception as e:
        logger.exception("Bulk create failed")
        return BulkResult(success=False, errors=[str(e)])


def bulk_update(
    data_list: list,
    context: OperationContext,
) -> BulkResult:
    if context.serializer_class is None:
        return BulkResult(success=False, errors=["OperationContext.serializer_class is required for update"])
    if context.serializer_context is None:
        return BulkResult(success=False, errors=["OperationContext.serializer_context is required for update"])

    hooks = context.hooks
    get_object_fn = context.get_object_fn
    errors: dict[str, list] = defaultdict(list)
    updated_instances: list = []

    for item in data_list:
        item_pk = item.get("id") or item.get("pk")
        if not item_pk:
            errors["missing_pk"].append(item)
            continue

        if get_object_fn:
            obj = get_object_fn(item_pk)
        else:
            try:
                obj = context.model.objects.get(pk=item_pk)
            except context.model.DoesNotExist:
                errors["not_found"].append({"pk": item_pk})
                continue

        if hooks and hooks.pre_update:
            item = hooks.pre_update(obj, item)

        serializer = context.serializer_class(
            obj, data=item, partial=True, context=context.serializer_context
        )
        if not serializer.is_valid():
            errors["validation"].append({"pk": item_pk, "errors": serializer.errors})
            continue

        try:
            with transaction.atomic():
                if hooks and hooks.perform_update:
                    instance = hooks.perform_update(serializer)
                else:
                    instance = serializer.save()

                if hooks and hooks.post_update:
                    hooks.post_update(instance)

            updated_instances.append(instance)
        except Exception as e:
            logger.exception(f"Bulk update failed for pk={item_pk}")
            errors["exception"].append({"pk": item_pk, "error": str(e)})

    flat_errors: list | None = None
    if errors:
        flat_errors = [
            {"type": k, "items": v} for k, v in errors.items()
        ]

    return BulkResult(
        success=not errors,
        instances=updated_instances or None,
        errors=flat_errors,
    )


def bulk_delete(
    pk_list: list,
    context: OperationContext,
) -> BulkResult:
    hooks = context.hooks
    get_object_fn = context.get_object_fn
    errors: dict[str, list] = defaultdict(list)
    deleted_count = 0

    for item_pk in pk_list:
        if get_object_fn:
            obj = get_object_fn(item_pk)
        else:
            try:
                obj = context.model.objects.get(pk=item_pk)
            except context.model.DoesNotExist:
                errors["not_found"].append({"pk": item_pk})
                continue

        if not obj:
            errors["not_found"].append({"pk": item_pk})
            continue

        try:
            with transaction.atomic():
                if hooks and hooks.pre_delete:
                    hooks.pre_delete(obj)

                if hooks and hooks.perform_destroy:
                    hooks.perform_destroy(obj)
                elif context.supports_soft_delete and hasattr(obj, "soft_delete"):
                    obj.soft_delete()
                else:
                    obj.delete()

                if hooks and hooks.post_delete:
                    hooks.post_delete(obj)

            deleted_count += 1
        except Exception as e:
            logger.exception(f"Bulk delete failed for pk={item_pk}")
            errors["exception"].append({"pk": item_pk, "error": str(e)})

    flat_errors: list | None = None
    if errors:
        flat_errors = [
            {"type": k, "items": v} for k, v in errors.items()
        ]

    return BulkResult(
        success=not errors,
        instances=None,
        data={"deleted_count": deleted_count},
        errors=flat_errors,
    )
