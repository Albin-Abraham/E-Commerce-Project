# core/admin/authentication.py
from django.conf import settings
from django.contrib.auth.backends import ModelBackend
from django.db.models import Q
from django.apps import apps
from rest_framework import exceptions
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.authentication import CSRFCheck
from rest_framework.exceptions import PermissionDenied

from core.admin.constants import PlatformHeaders, PlatformCookies

# Dynamically get the user model
USER_MODEL = apps.get_model(settings.AUTH_USER_MODEL)

# ------------------------------------------------------------
# 1. Multi-Field Auth Backend (Django Internal)
# ------------------------------------------------------------
class MultiFieldAuthBackend(ModelBackend):
    """
    Industrialized Auth: Authenticate using username or email in a single query.
    """
    def authenticate(self, request, username=None, password=None, **kwargs):
        if username is None:
            username = kwargs.get(USER_MODEL.USERNAME_FIELD)

        user = USER_MODEL.objects.filter(Q(username__iexact=username) | Q(email__iexact=username)).first()
        if not user:
            return None

        if user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None


# ------------------------------------------------------------
# 2. Platform Authentication (DRF)
# ------------------------------------------------------------
class PlatformAuthentication(JWTAuthentication):
    """
    Industrialized Platform Authentication.
    Differentiates between Web and Mobile security contexts using 
    centralized PlatformHeaders and PlatformCookies.
    """

    def authenticate(self, request):
        platform = request.headers.get(PlatformHeaders.PLATFORM, 'web').lower()
        header = self.get_header(request)
        
        # A. Try Header Authentication
        raw_token = None
        if header:
            raw_token = self.get_raw_token(header)
        
        # B. Try Cookie Authentication (For Web Platform)
        if not raw_token and platform == 'web':
            cookie_name = settings.SIMPLE_JWT.get('AUTH_COOKIE', PlatformCookies.ACCESS_TOKEN)
            raw_token = request.COOKIES.get(cookie_name)
            
            if raw_token:
                # Enforce CSRF for Cookie-based Web Authentication
                self.enforce_csrf(request)

        if raw_token is None:
            return None

        validated_token = self.get_validated_token(raw_token)
        return self.get_user(validated_token), validated_token

    def enforce_csrf(self, request):
        """
        Enforce CSRF validation for session-like cookie authentication.
        """
        check = CSRFCheck(lambda r: None)
        check.process_request(request)
        reason = check.process_view(request, None, (), {})
        if reason:
            raise PermissionDenied(f'CSRF Failed: {reason}')


# ------------------------------------------------------------
# 3. OpenAPI Documentation Extensions
# ------------------------------------------------------------
try:
    from drf_spectacular.extensions import OpenApiAuthenticationExtension

    class PlatformAuthenticationScheme(OpenApiAuthenticationExtension):
        target_class = 'core.admin.authentication.PlatformAuthentication'
        name = 'PlatformAuth'

        def get_security_definition(self, auto_schema):
            return {
                'type': 'http',
                'scheme': 'bearer',
                'bearerFormat': 'JWT',
                'description': (
                    'Hybrid Auth. Bearer token in Authorization header '
                    'or access_token cookie (web only, CSRF-protected).'
                )
            }
except ImportError:
    pass
