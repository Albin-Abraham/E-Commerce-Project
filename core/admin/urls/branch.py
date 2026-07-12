# core/admin/urls/branch.py
from django.urls import path
from core.admin.views.branch_views import BranchViewSet

urlpatterns = [
    path("", BranchViewSet.as_view(), {"HTTP_METHOD": ["GET", "POST"]}, name="branch-list"),
    path("<str:pk>/", BranchViewSet.as_view(), {"HTTP_METHOD": ["GET", "PUT", "DELETE"]}, name="branch-detail"),
]
