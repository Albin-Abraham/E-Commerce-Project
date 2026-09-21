from django.apps import AppConfig


class AccountingConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.accounting"
    verbose_name = "Financial Accounting & General Ledger"

    def ready(self):
        try:
            from core.registry.variable_registry import DomainVariableRegistry
            from apps.accounting.constants import AccountingKeys
            DomainVariableRegistry.register_app_variables("accounting", AccountingKeys)
        except Exception:
            pass
