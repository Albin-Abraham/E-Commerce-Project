from decimal import Decimal

import pytest
from django.db.models import QuerySet

from apps.shop.infrastructure.models.order import Order
from apps.shop.infrastructure.models.product import Product
from apps.shop.infrastructure.queries.order_queryset import OrderQuerySet
from apps.shop.infrastructure.queries.product_queryset import ProductQuerySet
from apps.shop.selectors.order_selectors import get_user_orders_qs
from apps.shop.selectors.product_selectors import (
    get_product_detail_qs,
    get_storefront_catalog_qs,
)
from tests.factories.user import UserFactory


@pytest.mark.django_db
class TestCoreQuerySetsAndSelectors:
    def setup_method(self):
        Product.objects.all().delete()
        Order.objects.all().delete()

        self.user = UserFactory(username="buyer1", email="buyer1@test.com")
        self.p1 = Product.objects.create(
            name="Pro Laptop",
            sku="PRO-1",
            price=Decimal("1200.00"),
            status="ACTIVE",
            is_active=True,
        )
        self.p2 = Product.objects.create(
            name="Basic Mouse", sku="BAS-1", price=Decimal("20.00"), status="ACTIVE", is_active=True
        )
        self.p3 = Product.objects.create(
            name="Archived Item",
            sku="ARC-1",
            price=Decimal("5.00"),
            status="ARCHIVED",
            is_active=False,
        )

        self.order1 = Order.objects.create(
            user=self.user,
            order_number="ORD-101",
            status="PENDING",
            total_amount=Decimal("1200.00"),
        )
        self.order2 = Order.objects.create(
            user=self.user,
            order_number="ORD-102",
            status="DELIVERED",
            total_amount=Decimal("20.00"),
        )

    def test_product_queryset_chaining_returns_qs(self):
        # Verify custom queryset methods return un-evaluated QuerySet
        qs = Product.objects.active()
        assert isinstance(qs, ProductQuerySet)
        assert isinstance(qs, QuerySet)

        # Method chaining
        chained_qs = qs.price_between(min_price=Decimal("10.00"), max_price=Decimal("100.00"))
        assert isinstance(chained_qs, ProductQuerySet)
        assert list(chained_qs.values_list("sku", flat=True)) == ["BAS-1"]

    def test_order_queryset_chaining_returns_qs(self):
        qs = Order.objects.for_user(self.user.id).status_in(["PENDING"])
        assert isinstance(qs, OrderQuerySet)
        assert isinstance(qs, QuerySet)
        assert list(qs.values_list("order_number", flat=True)) == ["ORD-101"]

    def test_storefront_catalog_selector_returns_lazy_qs(self):
        qs = get_storefront_catalog_qs(min_price=Decimal("50.00"))
        # Must be an un-evaluated QuerySet
        assert isinstance(qs, QuerySet)
        assert not qs._result_cache  # Un-evaluated query cache is None!

        # Evaluation produces expected items (active only, >= 50.00)
        items = list(qs)
        assert len(items) == 1
        assert items[0].sku == "PRO-1"

    def test_product_detail_selector_returns_lazy_qs(self):
        qs = get_product_detail_qs(self.p1.id)
        assert isinstance(qs, QuerySet)
        assert not qs._result_cache

        product = qs.first()
        assert product.id == self.p1.id

    def test_user_orders_selector_returns_lazy_qs(self):
        qs = get_user_orders_qs(user_id=self.user.id, statuses=["DELIVERED"])
        assert isinstance(qs, QuerySet)
        assert not qs._result_cache

        orders = list(qs)
        assert len(orders) == 1
        assert orders[0].order_number == "ORD-102"
