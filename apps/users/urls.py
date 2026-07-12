# apps/users/urls.py
from django.urls import path
from rest_framework_simplejwt.views import (
    TokenRefreshView,
)
from .views.auth_views import (
    UserLoginAuthView,
    UserLogoutAuthView,
    UserRegistrationAuthView,
    UserProfileAuthView
)

urlpatterns = [
    path("login/", UserLoginAuthView.as_view(), name="login"),
    path("register/", UserRegistrationAuthView.as_view(), name="register"),
    path("token-refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("logout/", UserLogoutAuthView.as_view(), name="logout"),
    path("profile/", UserProfileAuthView.as_view(), name="user_profile"),
]
