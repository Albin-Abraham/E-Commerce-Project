from django.urls import path
from apps.access_control.interface.views.approval_views import (
    ApprovalChainViewSet,
    ApprovalRequestViewSet,
    ApprovalSubmitView,
    ApprovalActionView,
)

urlpatterns = [
    path(
        "chains/",
        ApprovalChainViewSet.as_view(),
        {"HTTP_METHOD": ["get", "post"]},
        name="access-control-chain-list",
    ),
    path(
        "chains/<str:pk>/",
        ApprovalChainViewSet.as_view(),
        {"HTTP_METHOD": ["get", "put", "patch", "delete"]},
        name="access-control-chain-detail",
    ),
    path(
        "requests/",
        ApprovalRequestViewSet.as_view(),
        {"HTTP_METHOD": ["get"]},
        name="access-control-request-list",
    ),
    path(
        "requests/submit/",
        ApprovalSubmitView.as_view(),
        {"HTTP_METHOD": ["post"]},
        name="access-control-request-submit",
    ),
    path(
        "requests/<str:pk>/",
        ApprovalRequestViewSet.as_view(),
        {"HTTP_METHOD": ["get"]},
        name="access-control-request-detail",
    ),
    path(
        "requests/<str:pk>/approve/",
        ApprovalActionView.as_view(action_type="approve"),
        name="access-control-request-approve",
    ),
    path(
        "requests/<str:pk>/reject/",
        ApprovalActionView.as_view(action_type="reject"),
        name="access-control-request-reject",
    ),
    path(
        "requests/<str:pk>/escalate/",
        ApprovalActionView.as_view(action_type="escalate"),
        name="access-control-request-escalate",
    ),
    path(
        "requests/<str:pk>/cancel/",
        ApprovalActionView.as_view(action_type="cancel"),
        name="access-control-request-cancel",
    ),
]
