from rest_framework.permissions import IsAdminUser
from core.base_views.api_views import BaseAPIView
from core.admin.helpers.response_helpers import ResponseFactory
from core.admin.services.test_runner_service import TestRunnerService
from core.admin.models import TestRun
from django.shortcuts import get_object_or_404

class TestRunTriggerView(BaseAPIView):
    """
    POST to trigger a new test run.
    """
    permission_classes = [IsAdminUser]
    entity_name = "TestRun"

    def post(self, request, *args, **kwargs):
        module = request.data.get('module', 'all')
        category = request.data.get('category', 'all')
        
        # In a production environment, we would use Celery:
        # run_test_suite_task.delay(module, category)
        # But for this implementation, we run it synchronously for demonstration
        # and simplicity given the small test suite.
        
        test_run = TestRunnerService.run_suite(module, category)
        
        return ResponseFactory.created(
            data={
                "run_id": test_run.id,
                "status": test_run.status
            },
            message="Test run initiated"
        )

class TestRunListView(BaseAPIView):
    """
    GET list of recent test runs.
    """
    permission_classes = [IsAdminUser]
    entity_name = "TestRun"

    def get(self, request, *args, **kwargs):
        runs = TestRun.objects.all()[:10]
        data = [{
            "id": run.id,
            "module": run.module,
            "category": run.category,
            "status": run.status,
            "summary": run.summary,
            "started_at": run.started_at,
            "completed_at": run.completed_at
        } for run in runs]
        
        return ResponseFactory.success(
            data=data,
            message="Test runs fetched successfully"
        )

class TestRunDetailView(BaseAPIView):
    """
    GET details and logs for a specific test run.
    """
    permission_classes = [IsAdminUser]
    entity_name = "TestRun"

    def get(self, request, pk, *args, **kwargs):
        run = get_object_or_404(TestRun, pk=pk)
        return ResponseFactory.success(
            data={
                "id": run.id,
                "module": run.module,
                "category": run.category,
                "status": run.status,
                "logs": run.logs,
                "summary": run.summary,
                "started_at": run.started_at,
                "completed_at": run.completed_at
            }
        )
