from django.apps import AppConfig


class ShopConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.shop"
    label = "shop"
    verbose_name = "Shop"

    def ready(self):
        try:
            import apps.shop.constants  # noqa: F401
            import apps.shop.signals  # noqa: F401
            from apps.shop.policies.vendor_product_policy import VendorProductPolicy

            # Domain Policy Inversion-of-Control Registration
            from core.authorization.registries import PolicyRegistry

            PolicyRegistry.register("product", "VENDOR", VendorProductPolicy)
            PolicyRegistry.register("product", None, VendorProductPolicy)
        except Exception:
            pass
