from django.urls import path
from core.admin.views.orchestration_views import TestRunTriggerView, TestRunListView, TestRunDetailView
from core.admin.views.dashboard_views import TestDashboardView

from core.admin.views.import_views import ImportPackageViewSet

urlpatterns = [
    path("runs/", TestRunListView.as_view(), name="test-run-list"),
    path("runs/trigger/", TestRunTriggerView.as_view(), name="test-run-trigger"),
    path("runs/<int:pk>/", TestRunDetailView.as_view(), name="test-run-detail"),
    # UI Dashboard
    path("dashboard/", TestDashboardView.as_view(), name="test-dashboard"),

    # Data Onboarding & Import Engine
    path("imports/packages/", ImportPackageViewSet.as_view(), {"HTTP_METHOD": ["GET", "POST"]}, name="admin-import-package-list"),
    path("imports/packages/<str:pk>/", ImportPackageViewSet.as_view(), {"HTTP_METHOD": ["GET", "PUT", "DELETE"]}, name="admin-import-package-detail"),
]
