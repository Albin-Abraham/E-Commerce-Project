from django.apps import AppConfig


class AccessControlConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.access_control"

    def ready(self):
        from apps.access_control.providers import EntityAccessControlProvider
        from core.registry.provider_registry import ProviderRegistry

        ProviderRegistry.register_acl_provider(EntityAccessControlProvider())
