import logging

from celery.result import AsyncResult
from rest_framework.views import APIView
from rest_framework.request import Request

from backend import celery_app
from core.admin.helpers.response_helpers import ResponseFactory

logger = logging.getLogger(__name__)

__all__ = [
    "OperationStatusView",
]


class OperationStatusView(APIView):
    """
    Poll the status of an async Celery operation (bulk create, update,
    delete, batch, import, export).

    GET /api/admin/operations/<task_id>/
    """

    http_method_names = ["get"]

    def get(self, request: Request, task_id: str):
        result = AsyncResult(task_id, app=celery_app)

        return ResponseFactory.success(
            message="Task status fetched",
            data={
                "task_id": task_id,
                "status": result.status,
                "ready": result.ready(),
                "successful": result.successful(),
                "result": result.result if result.ready() else None,
                "error": str(result.traceback) if result.failed() else None,
            },
        )
