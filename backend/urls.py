# backend/urls.py
from django.contrib import admin
from django.urls import path, include
from django.views.generic import RedirectView
from .settings.base import ADMIN_URL
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from core.admin.views.health_views import health_live, health_ready

from rest_framework.permissions import AllowAny

urlpatterns = [
    # Root Redirect
    path('', RedirectView.as_view(url='/api/docs/', permanent=False), name='api-root'),

    path(ADMIN_URL, admin.site.urls),

    # OpenAPI / Schema
    path('api/schema/', SpectacularAPIView.as_view(permission_classes=[AllowAny], authentication_classes=[]), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema', permission_classes=[AllowAny], authentication_classes=[]), name='swagger-ui'),

    # Admin / Core Infrastructure
    path('api/admin/', include("core.admin.urls")),
    
    # Session Management
    path('api/sessions/', include("core.session.urls")),
    
    # Auth / User Management
    path('api/auth/', include("apps.users.urls")),

    # Access Control (RBAC + Approval)
    path('api/access/', include("apps.access_control.urls")),

    # Health Checks (Can also be accessed via api/admin/health/)
    path('health/live/', health_live, name='health_live'),
    path('health/ready/', health_ready, name='health_ready'),
]
