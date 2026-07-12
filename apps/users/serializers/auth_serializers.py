from django.contrib.auth import get_user_model, authenticate
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from ..services.auth_service import AuthService

User = get_user_model()  # resolves USER_MODEL safely

# ----------------------------
# Login Serializer
# ----------------------------
class UserLoginSerializer(serializers.Serializer):
    login = serializers.CharField(required=False, help_text="Username or Email")
    user = serializers.CharField(required=False, help_text="Alias for login")
    username = serializers.CharField(required=False, help_text="Alias for login")
    email = serializers.CharField(required=False, help_text="Alias for login")
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        login = attrs.get("login") or attrs.get("user") or attrs.get("username") or attrs.get("email")
        password = attrs.get("password")

        if not login:
            raise serializers.ValidationError({"login": "This field, 'username', 'user', or 'email' is required."})

        # Leverage custom MultiFieldAuthBackend via authenticate()
        request = self.context.get("request")
        user = authenticate(request=request, username=login, password=password)

        if not user:
            raise serializers.ValidationError("Invalid credentials. Please check your username/email and password.")

        if not user.is_active:
            raise serializers.ValidationError("User account is disabled.")

        attrs["user"] = user
        return attrs

# ----------------------------
# Logout Serializer
# ----------------------------
class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField(required=False, help_text="Refresh token to blacklist")

    def validate(self, attrs):
        request = self.context.get("request")
        self.token = attrs.get("refresh")
        
        # Fallback to Hybrid Cookies for web platform
        if not self.token and request:
            from core.admin.constants import PlatformCookies
            self.token = request.COOKIES.get(PlatformCookies.REFRESH_TOKEN)

        if not self.token:
            raise serializers.ValidationError("Refresh token is required (either in payload or cookies).")
        return attrs

    def save(self, **kwargs):
        try:
            token = RefreshToken(self.token)
            token.blacklist()  # Blacklist the refresh token
        except Exception:
            raise serializers.ValidationError("Token is invalid or already blacklisted")


# ----------------------------
# Registration Serializer
# ----------------------------
class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer for User Registration.
    Delegates validation and creation to AuthService/ValidationMediator.
    """
    password = serializers.CharField(write_only=True, required=True)
    full_name = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ["email", "username", "password", "full_name"]

    def create(self, validated_data):
        """
        Orchestration: Delegate to AuthService which handles ValidationMediator.
        """
        try:
            return AuthService.register_user(validated_data)
        except serializers.ValidationError as e:
            raise e
        except Exception as e:
            raise serializers.ValidationError({"detail": str(e)})
