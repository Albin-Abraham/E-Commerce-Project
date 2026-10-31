from decimal import Decimal

from django.db import models


class ProductQuerySet(models.QuerySet):
    """
    Industrialized Domain QuerySet Primitives for Products.
    Strictly composable: Every method returns self (un-evaluated QuerySet / qs statement).
    """

    def active(self) -> "ProductQuerySet":
        """Filter for active, purchasable products."""
        return self.filter(is_active=True, status="ACTIVE")

    def with_relations(self) -> "ProductQuerySet":
        """Pre-fetch related foreign keys and variants to prevent N+1 queries."""
        return self.select_related("brand", "category").prefetch_related(
            "variants__inventory_records", "legacy_inventory_records"
        )

    def price_between(
        self, min_price: Decimal | None = None, max_price: Decimal | None = None
    ) -> "ProductQuerySet":
        """Filter within an optional numeric price range."""
        qs = self
        if min_price is not None:
            qs = qs.filter(price__gte=min_price)
        if max_price is not None:
            qs = qs.filter(price__lte=max_price)
        return qs

    def by_category(self, category_id: str) -> "ProductQuerySet":
        return self.filter(category_id=category_id)

    def by_brand(self, brand_id: str) -> "ProductQuerySet":
        return self.filter(brand_id=brand_id)

    def in_stock(self) -> "ProductQuerySet":
        """Filter products that have inventory greater than 0."""
        return self.filter(variants__inventory_records__quantity__gt=0).distinct()
