from django.apps import AppConfig


class ProcurementPOSConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.procurement_pos"
    verbose_name = "Procurement & POS System"

    def ready(self):
        try:
            from core.registry.variable_registry import DomainVariableRegistry
            from apps.procurement_pos.constants import ProcurementKeys, POSKeys
            DomainVariableRegistry.register_app_variables("procurement", ProcurementKeys)
            DomainVariableRegistry.register_app_variables("pos", POSKeys)
        except Exception:
            pass
