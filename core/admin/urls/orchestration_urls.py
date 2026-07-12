from django.urls import path
from core.admin.views.orchestration_views import TestRunTriggerView, TestRunListView, TestRunDetailView
from core.admin.views.dashboard_views import TestDashboardView

urlpatterns = [
    path("runs/", TestRunListView.as_view(), name="test-run-list"),
    path("runs/trigger/", TestRunTriggerView.as_view(), name="test-run-trigger"),
    path("runs/<int:pk>/", TestRunDetailView.as_view(), name="test-run-detail"),
    # UI Dashboard
    path("dashboard/", TestDashboardView.as_view(), name="test-dashboard"),
]
