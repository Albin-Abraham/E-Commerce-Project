from django.apps import AppConfig


class AccessControlConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.access_control'

    def ready(self):
        from core.registry.provider_registry import ProviderRegistry
        from apps.access_control.providers import EntityAccessControlProvider
        ProviderRegistry.register_acl_provider(EntityAccessControlProvider())
