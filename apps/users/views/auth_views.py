from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib import auth
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import AllowAny

from core.base_views.api_views import BaseAPIView
from core.admin.helpers.response_helpers import ResponseFactory

from ..serializers.auth_serializers import (
    UserLoginSerializer,
    LogoutSerializer,
    UserRegistrationSerializer,
    ChangePasswordSerializer,
    ForgotPasswordSerializer,
    ResetPasswordSerializer,
)


# ----------------------------
# Login View
# ----------------------------
class UserLoginAuthView(BaseAPIView):
    """
    DRF JWT Login View
    Accepts username or email + password
    Returns access + refresh token with tenant claims.
    """
    permission_classes = [AllowAny]
    authentication_classes = []
    serializer_class = UserLoginSerializer
    entity_name = "Auth"
    http_method_names = ["post"]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]

        # Fetch profile without extra query
        profile = getattr(user, "profile", None)

        # Create Django Session
        auth.login(request, user)
        
        if profile:
            from core.session.context import SessionContext
            SessionContext.set_context(
                request, 
                company_id=profile.company_id,
                branch_id=profile.branch_id
            )

        # Create tokens with tenant claims
        refresh = RefreshToken.for_user(user)
        if profile:
            refresh['company_id'] = str(profile.company_id) if profile.company_id else None
            refresh['branch_id'] = str(profile.branch_id) if profile.branch_id else None

        response = ResponseFactory.success(
            data={
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": {
                    "id": str(user.id),
                    "email": user.email,
                    "username": user.username,
                    "full_name": getattr(user, "full_name", ""),
                    "profile_id": str(profile.user_id) if profile else None
                }
            },
            message="Login successful"
        )

        # Industrialized Hybrid Security: Set Cookies for Web Platform
        from core.admin.constants import PlatformHeaders, PlatformCookies
        platform = request.headers.get(PlatformHeaders.PLATFORM, "web").lower()
        if platform == "web":
            from django.conf import settings
            cookie_settings = {
                "httponly": True,
                "secure": not settings.DEBUG,
                "samesite": "Lax",
                "max_age": settings.SIMPLE_JWT.get("ACCESS_TOKEN_LIFETIME").total_seconds()
            }
            response.set_cookie(PlatformCookies.ACCESS_TOKEN, str(refresh.access_token), **cookie_settings)
            response.set_cookie(PlatformCookies.REFRESH_TOKEN, str(refresh), **cookie_settings)

        return response

# ----------------------------
# Logout View
# ----------------------------
class UserLogoutAuthView(BaseAPIView):
    """
    DRF JWT Logout View
    Blacklists the refresh token and clears the session.
    """
    permission_classes = [AllowAny]
    authentication_classes = []
    serializer_class = LogoutSerializer
    entity_name = "Auth"
    http_method_names = ["post"]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            from core.session.context import SessionContext
            refresh_token = serializer.validated_data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            
            # Clear multi-tenant session context
            SessionContext.clear_context(request)
            auth.logout(request)
            
            response = ResponseFactory.success(message="Logout successful")
            
            # Clear hybrid cookies
            from core.admin.constants import PlatformCookies
            response.delete_cookie(PlatformCookies.ACCESS_TOKEN)
            response.delete_cookie(PlatformCookies.REFRESH_TOKEN)
            
            return response
        except Exception as e:
            return ResponseFactory.error(
                message="Logout failed",
                details={"error": str(e)}
            )

# ----------------------------
# User Profile View
# ----------------------------
class UserProfileAuthView(BaseAPIView):
    """
    Industrialized Profile View.
    Delegates to IUserSessionClassServices for contract-compliant manifest generation.
    """
    entity_name = "User Profile"
    http_method_names = ["get"]

    def get(self, request, *args, **kwargs):
        # Industrialized: Use decoupled service instead of direct user/request access
        profile_manifest = self.auth_service.get_user_profile(request)
        
        return ResponseFactory.success(
            data=profile_manifest,
            message="User profile retrieved successfully"
        )


# ----------------------------
# Dedicated Session Context Views
# ----------------------------
class SessionCompanySetView(BaseAPIView):
    """View to explicitly SET the active Company context."""
    entity_name = "Company Context"
    http_method_names = ["post"]

    def post(self, request, *args, **kwargs):
        from core.session.context import SessionContext
        SessionContext.set_company(request, request.data.get("company_id"))
        return ResponseFactory.success(message="Company context updated successfully")


class SessionCompanyContextView(BaseAPIView):
    """View to GET the active Company context."""
    entity_name = "Company Context"
    http_method_names = ["get"]

    def get(self, request, *args, **kwargs):
        return ResponseFactory.success(data={"company_id": SessionContext.get_company_id(request)})




class SessionBranchContextView(BaseAPIView):
    """View to GET/SET the active Branch context."""
    entity_name = "Branch Context"
    http_method_names = ["get", "post"]

    def post(self, request, *args, **kwargs):
        branch_id = request.data.get("branch_id") or request.data.get("branch")
        if branch_id:
            SessionContext.set_branch(request, branch_id)
        return ResponseFactory.success(message="Branch context updated successfully")

    def get(self, request, *args, **kwargs):
        return ResponseFactory.success(data={"branch_id": SessionContext.get_branch_id(request)})


# ----------------------------
# Session Context Orchestrator
# ----------------------------
class SessionContextOrchestratorView(BaseAPIView):
    """View to GET/SET Company and Branch atomically."""
    entity_name = "Session Context"
    http_method_names = ["get", "post"]

    def post(self, request, *args, **kwargs):
        company_id = request.data.get("company_id") or request.data.get("company")
        branch_id = request.data.get("branch_id") or request.data.get("branch")
        
        SessionContext.set_context(request, company_id=company_id, branch_id=branch_id)
        return ResponseFactory.success(message="Session context updated successfully")

    def get(self, request, *args, **kwargs):
        return ResponseFactory.success(data={
            "company_id": SessionContext.get_company_id(request),
            "branch_id": SessionContext.get_branch_id(request)
        })


# ----------------------------
# Registration View
# ----------------------------
class UserRegistrationAuthView(BaseAPIView):
    """
    Standard User Registration View.
    Creates a new user and returns a success response.
    """
    permission_classes = [AllowAny]
    authentication_classes = []
    serializer_class = UserRegistrationSerializer
    entity_name = "Auth"
    http_method_names = ["post"]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return ResponseFactory.success(
            data={"user_id": str(user.id), "username": user.username},
            message="User registered successfully",
            status_code=status.HTTP_201_CREATED
        )


# ----------------------------
# Change Password View
# ----------------------------
class ChangePasswordView(BaseAPIView):
    """Authenticated password change."""
    serializer_class = ChangePasswordSerializer
    entity_name = "Auth"
    http_method_names = ["post"]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        user.set_password(serializer.validated_data["new_password"])
        user.save()

        return ResponseFactory.success(message="Password changed successfully.")


# ----------------------------
# Forgot Password View
# ----------------------------
class ForgotPasswordView(BaseAPIView):
    """Request password reset. Returns token in response (no email backend required)."""
    permission_classes = [AllowAny]
    authentication_classes = []
    serializer_class = ForgotPasswordSerializer
    entity_name = "Auth"
    http_method_names = ["post"]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"]
        from apps.users.services.auth_service import AuthService
        result = AuthService.generate_password_reset_token(email)

        return ResponseFactory.success(
            data=result,
            message="Password reset token generated."
        )


# ----------------------------
# Reset Password View
# ----------------------------
class ResetPasswordView(BaseAPIView):
    """Reset password using token."""
    permission_classes = [AllowAny]
    authentication_classes = []
    serializer_class = ResetPasswordSerializer
    entity_name = "Auth"
    http_method_names = ["post"]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        from apps.users.services.auth_service import AuthService
        success = AuthService.reset_password_with_token(
            token=serializer.validated_data["token"],
            new_password=serializer.validated_data["new_password"],
        )

        if not success:
            return ResponseFactory.error(
                message="Invalid or expired token.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        return ResponseFactory.success(message="Password reset successfully.")
