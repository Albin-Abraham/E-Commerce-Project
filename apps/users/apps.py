from django.apps import AppConfig


class UsersConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.users"
    label = "users"

    def ready(self):
        # Register RBAC Signals

        from apps.users.services.auth_service import AuthService
        from core.registry.provider_registry import ProviderRegistry

        ProviderRegistry.register_auth_provider(AuthService())
