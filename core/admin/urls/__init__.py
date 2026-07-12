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

    # Shop App
    path("shop/", include("apps.shop.interface.urls")),
]


def _get_user_management_urls():
    from apps.users.views.user_management import (
        UserManagementViewSet,
        UserDeactivateView,
        UserActivateView,
        UserResetPasswordView,
        UserAssignRoleView,
        UserRemoveRoleView,
        UserAssignGroupView,
        UserRemoveGroupView,
        UserSetPermissionsView,
    )
    return [
        path(
            "users/",
            UserManagementViewSet.as_view(),
            {"HTTP_METHOD": ["get", "post"]},
            name="user-list",
        ),
        path(
            "users/<str:pk>/",
            UserManagementViewSet.as_view(),
            {"HTTP_METHOD": ["get", "put", "patch", "delete"]},
            name="user-detail",
        ),
        path(
            "users/<str:pk>/deactivate/",
            UserDeactivateView.as_view(),
            name="user-deactivate",
        ),
        path(
            "users/<str:pk>/activate/",
            UserActivateView.as_view(),
            name="user-activate",
        ),
        path(
            "users/<str:pk>/reset-password/",
            UserResetPasswordView.as_view(),
            name="user-reset-password",
        ),
        path(
            "users/<str:pk>/assign-role/",
            UserAssignRoleView.as_view(),
            name="user-assign-role",
        ),
        path(
            "users/<str:pk>/remove-role/<str:role_id>/",
            UserRemoveRoleView.as_view(),
            name="user-remove-role",
        ),
        path(
            "users/<str:pk>/assign-group/",
            UserAssignGroupView.as_view(),
            name="user-assign-group",
        ),
        path(
            "users/<str:pk>/remove-group/<str:group_id>/",
            UserRemoveGroupView.as_view(),
            name="user-remove-group",
        ),
        path(
            "users/<str:pk>/set-permissions/",
            UserSetPermissionsView.as_view(),
            name="user-set-permissions",
        ),
    ]


def _get_role_urls():
    from apps.users.views.role_views import RoleViewSet
    return [
        path(
            "roles/",
            RoleViewSet.as_view(),
            {"HTTP_METHOD": ["get", "post"]},
            name="role-list",
        ),
        path(
            "roles/<str:pk>/",
            RoleViewSet.as_view(),
            {"HTTP_METHOD": ["get", "put", "patch", "delete"]},
            name="role-detail",
        ),
    ]


def _get_group_urls():
    from apps.users.views.group_views import GroupViewSet
    return [
        path(
            "role-groups/",
            GroupViewSet.as_view(),
            {"HTTP_METHOD": ["get", "post"]},
            name="group-list",
        ),
        path(
            "role-groups/<str:pk>/",
            GroupViewSet.as_view(),
            {"HTTP_METHOD": ["get", "put", "patch", "delete"]},
            name="group-detail",
        ),
    ]


urlpatterns.extend(_get_user_management_urls())
urlpatterns.extend(_get_role_urls())
urlpatterns.extend(_get_group_urls())
