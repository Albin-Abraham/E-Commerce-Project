# apps/users/urls.py
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views.auth_views import (
    UserLoginAuthView,
    UserLogoutAuthView,
    UserRegistrationAuthView,
    UserProfileAuthView,
    ChangePasswordView,
    ForgotPasswordView,
    ResetPasswordView,
)
from .views.user_management import UserManagementViewSet
from .views.role_views import RoleViewSet
from .views.group_views import GroupViewSet

urlpatterns = [
    # Auth endpoints
    path("login/", UserLoginAuthView.as_view(), name="login"),
    path("register/", UserRegistrationAuthView.as_view(), name="register"),
    path("token-refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("logout/", UserLogoutAuthView.as_view(), name="logout"),
    path("profile/", UserProfileAuthView.as_view(), name="user_profile"),

    # Password management
    path("change-password/", ChangePasswordView.as_view(), name="change-password"),
    path("forgot-password/", ForgotPasswordView.as_view(), name="forgot-password"),
    path("reset-password/", ResetPasswordView.as_view(), name="reset-password"),
]

# User Management URLs (registered separately under /api/admin/users/)
user_management_urls = [
    path(
        "",
        UserManagementViewSet.as_view(),
        {"HTTP_METHOD": ["get", "post"]},
        name="user-list",
    ),
    path(
        "<str:pk>/",
        UserManagementViewSet.as_view(),
        {"HTTP_METHOD": ["get", "put", "patch", "delete"]},
        name="user-detail",
    ),
    path(
        "<str:pk>/deactivate/",
        UserManagementViewSet.as_view(),
        {"HTTP_METHOD": ["post"]},
        name="user-deactivate",
    ),
    path(
        "<str:pk>/activate/",
        UserManagementViewSet.as_view(),
        {"HTTP_METHOD": ["post"]},
        name="user-activate",
    ),
    path(
        "<str:pk>/reset-password/",
        UserManagementViewSet.as_view(),
        {"HTTP_METHOD": ["post"]},
        name="user-reset-password",
    ),
    path(
        "<str:pk>/assign-role/",
        UserManagementViewSet.as_view(),
        {"HTTP_METHOD": ["post"]},
        name="user-assign-role",
    ),
    path(
        "<str:pk>/remove-role/<str:role_id>/",
        UserManagementViewSet.as_view(),
        {"HTTP_METHOD": ["delete"]},
        name="user-remove-role",
    ),
    path(
        "<str:pk>/assign-group/",
        UserManagementViewSet.as_view(),
        {"HTTP_METHOD": ["post"]},
        name="user-assign-group",
    ),
    path(
        "<str:pk>/remove-group/<str:group_id>/",
        UserManagementViewSet.as_view(),
        {"HTTP_METHOD": ["delete"]},
        name="user-remove-group",
    ),
    path(
        "<str:pk>/set-permissions/",
        UserManagementViewSet.as_view(),
        {"HTTP_METHOD": ["post"]},
        name="user-set-permissions",
    ),
]

# Role Management URLs
role_urls = [
    path(
        "",
        RoleViewSet.as_view(),
        {"HTTP_METHOD": ["get", "post"]},
        name="role-list",
    ),
    path(
        "<str:pk>/",
        RoleViewSet.as_view(),
        {"HTTP_METHOD": ["get", "put", "patch", "delete"]},
        name="role-detail",
    ),
]

# Group Management URLs
group_urls = [
    path(
        "",
        GroupViewSet.as_view(),
        {"HTTP_METHOD": ["get", "post"]},
        name="group-list",
    ),
    path(
        "<str:pk>/",
        GroupViewSet.as_view(),
        {"HTTP_METHOD": ["get", "put", "patch", "delete"]},
        name="group-detail",
    ),
]
