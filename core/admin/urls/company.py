# core/admin/urls/company.py
from django.urls import path
from core.admin.views.company_views import CompanyViewSet

urlpatterns = [
    path("", CompanyViewSet.as_view(), {"HTTP_METHOD": ["GET", "POST"]}, name="company-list"),
    path("<str:pk>/", CompanyViewSet.as_view(), {"HTTP_METHOD": ["GET", "PUT", "DELETE"]}, name="company-detail"),
]
