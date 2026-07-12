import logging

from backend import celery_app

from core.admin.helpers.bulk_helpers import (
    BulkResult,
    OperationContext,
    bulk_create,
    bulk_delete,
    bulk_update,
)
from core.admin.helpers.batch_helpers import batch_process

logger = logging.getLogger(__name__)

__all__ = [
    "bulk_create_task",
    "bulk_update_task",
    "bulk_delete_task",
    "batch_process_task",
]


@celery_app.task(bind=True, rate_limit="50/m", name="core.admin.tasks.bulk_create_task")
def bulk_create_task(self, data, context_dict):
    ctx = OperationContext.from_dict(context_dict)
    result: BulkResult = bulk_create(data, ctx)
    logger.info(
        "bulk_create_task %s | success=%s | count=%s",
        self.request.id, result.success, len(result.instances) if result.instances else 0,
    )
    return {
        "success": result.success,
        "count": len(result.instances) if result.instances else 0,
        "errors": result.errors,
    }


@celery_app.task(bind=True, rate_limit="50/m", name="core.admin.tasks.bulk_update_task")
def bulk_update_task(self, data_list, context_dict):
    ctx = OperationContext.from_dict(context_dict)
    result: BulkResult = bulk_update(data_list, ctx)
    logger.info(
        "bulk_update_task %s | success=%s | count=%s",
        self.request.id, result.success, len(result.instances) if result.instances else 0,
    )
    return {
        "success": result.success,
        "count": len(result.instances) if result.instances else 0,
        "errors": result.errors,
    }


@celery_app.task(bind=True, rate_limit="50/m", name="core.admin.tasks.bulk_delete_task")
def bulk_delete_task(self, pk_list, context_dict):
    ctx = OperationContext.from_dict(context_dict)
    result: BulkResult = bulk_delete(pk_list, ctx)
    deleted = result.data.get("deleted_count", 0) if result.data else 0
    logger.info(
        "bulk_delete_task %s | success=%s | count=%s",
        self.request.id, result.success, deleted,
    )
    return {
        "success": result.success,
        "count": deleted,
        "errors": result.errors,
    }


@celery_app.task(bind=True, name="core.admin.tasks.batch_process_task")
def batch_process_task(self, operations, context_dict, mode):
    ctx = OperationContext.from_dict(context_dict)
    results = batch_process(operations, ctx, mode=mode)
    success_count = sum(1 for r in results if r.success)
    logger.info(
        "batch_process_task %s | ok=%s/%s",
        self.request.id, success_count, len(results),
    )
    return {
        "success": success_count == len(results),
        "total": len(results),
        "success_count": success_count,
    }
