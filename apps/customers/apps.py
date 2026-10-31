from django.apps import AppConfig


class CustomersConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.customers"
    verbose_name = "Customer Management"

    def ready(self):
        try:
            from apps.customers.policies.customer_cart_policy import CustomerCartPolicy
            from core.authorization.registries import PolicyRegistry

            PolicyRegistry.register("cart", "CUSTOMER", CustomerCartPolicy)
            PolicyRegistry.register("cart", None, CustomerCartPolicy)
        except Exception:
            pass
