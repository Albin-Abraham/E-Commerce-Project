# core/admin/urls/__init__.py
from django.urls import path, include
from core.admin.views.health_views import health_live, health_ready

urlpatterns = [
    # System Health Probes
    path("health/live/", health_live, name="health-live"),
    path("health/ready/", health_ready, name="health-ready"),
    
    # Administrative Entities
    path("companies/", include("core.admin.urls.company")),
    path("business-units/", include("core.admin.urls.business_unit")),
    path("branches/", include("core.admin.urls.branch")),
    # Test Dashboard API
    path("tests/", include("core.admin.urls.orchestration_urls")),
    # Async Operation Status
    path("", include("core.admin.urls.operations")),
]
