from __future__ import annotations

from core.base_models.seed_data.domains.ecommerce.catalog import (
    AttributeSeedModule,
    BrandSeedModule,
    CategoryEdgeSeedModule,
    CategorySeedModule,
    ProductMediaSeedModule,
    ProductSeedModule,
    VariantSeedModule,
)
from core.base_models.seed_data.domains.ecommerce.checkout import (
    PaymentMethodSeedModule,
    ShippingMethodSeedModule,
)
from core.base_models.seed_data.domains.ecommerce.customers import (
    CustomerGroupSeedModule,
    CustomerSegmentSeedModule,
)
from core.base_models.seed_data.domains.ecommerce.inventory import (
    StockSeedModule,
    StorageLocationSeedModule,
    WarehouseSeedModule,
)
from core.base_models.seed_data.domains.ecommerce.orders import (
    CancellationReasonSeedModule,
    OrderStatusSeedModule,
)
from core.base_models.seed_data.domains.ecommerce.pricing import (
    PriceListSeedModule,
    PricingRuleSeedModule,
)
from core.base_models.seed_data.engine.registry import SeedDomainRegistry
from core.base_models.seed_data.engine.runner import DomainRunner


class EcommerceSeedRunner(DomainRunner):
    domain_code = "ecommerce"
    domain_name = "E-Commerce"

    def __init__(self, config_root: str | None = None):
        super().__init__(config_root=config_root)
        self._register_modules()

    def _register_modules(self) -> None:
        # Catalog Subdomain
        self.register_module(BrandSeedModule(), "catalog/brands.yaml")
        self.register_module(CategorySeedModule(), "catalog/categories.yaml")
        self.register_module(CategoryEdgeSeedModule(), "catalog/category_edges.yaml")
        self.register_module(AttributeSeedModule(), "catalog/attributes.yaml")
        self.register_module(ProductSeedModule(), "catalog/products.yaml")
        self.register_module(VariantSeedModule(), "catalog/product_variants.yaml")
        self.register_module(ProductMediaSeedModule(), "catalog/product_media.yaml")

        # Inventory Subdomain
        self.register_module(WarehouseSeedModule(), "inventory/warehouses.yaml")
        self.register_module(StorageLocationSeedModule(), "inventory/storage_locations.yaml")
        self.register_module(StockSeedModule(), "inventory/stock.yaml")

        # Pricing Subdomain
        self.register_module(PriceListSeedModule(), "pricing/price_lists.yaml")
        self.register_module(PricingRuleSeedModule(), "pricing/pricing_rules.yaml")

        # Customers Subdomain
        self.register_module(CustomerGroupSeedModule(), "customers/customer_groups.yaml")
        self.register_module(CustomerSegmentSeedModule(), "customers/customer_segments.yaml")

        # Checkout Subdomain
        self.register_module(PaymentMethodSeedModule(), "checkout/payment_methods.yaml")
        self.register_module(ShippingMethodSeedModule(), "checkout/shipping_methods.yaml")

        # Orders Subdomain
        self.register_module(OrderStatusSeedModule(), "orders/order_statuses.yaml")
        self.register_module(CancellationReasonSeedModule(), "orders/cancellation_reasons.yaml")


# Automatically register EcommerceSeedRunner with the central domain registry
SeedDomainRegistry.register("ecommerce", EcommerceSeedRunner)
