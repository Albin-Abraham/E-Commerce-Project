from django.urls import path
from apps.access_control.interface.views.approval_views import (
    ApprovalChainViewSet,
    ApprovalRequestViewSet,
    ApprovalSubmitView,
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
        ApprovalRequestViewSet.as_view(),
        {"HTTP_METHOD": ["post"]},
        name="access-control-request-approve",
    ),
    path(
        "requests/<str:pk>/reject/",
        ApprovalRequestViewSet.as_view(),
        {"HTTP_METHOD": ["post"]},
        name="access-control-request-reject",
    ),
    path(
        "requests/<str:pk>/escalate/",
        ApprovalRequestViewSet.as_view(),
        {"HTTP_METHOD": ["post"]},
        name="access-control-request-escalate",
    ),
    path(
        "requests/<str:pk>/cancel/",
        ApprovalRequestViewSet.as_view(),
        {"HTTP_METHOD": ["post"]},
        name="access-control-request-cancel",
    ),
]
