from decimal import Decimal

import pytest
from rest_framework.test import APIRequestFactory, force_authenticate

from apps.shop.infrastructure.models.order import Order
from apps.shop.infrastructure.models.product import Product
from apps.shop.interface.views.order_views import OrderViewSet
from apps.shop.interface.views.product_views import ProductViewSet
from tests.factories.user import UserFactory


@pytest.mark.django_db
class TestViewSetAdvancedFilters:
    def setup_method(self):
        self.factory = APIRequestFactory()
        self.superuser = UserFactory(is_superuser=True, is_staff=True)
        self.product_view = ProductViewSet.as_view()
        self.order_view = OrderViewSet.as_view()

        Product.objects.all().delete()
        Order.objects.all().delete()

        self.p1 = Product.objects.create(
            name="Mechanical Keyboard",
            sku="KB-001",
            price=Decimal("150.00"),
            status="ACTIVE",
            is_active=True,
        )
        self.p2 = Product.objects.create(
            name="Wireless Mouse",
            sku="MS-002",
            price=Decimal("45.00"),
            status="ACTIVE",
            is_active=True,
        )
        self.p3 = Product.objects.create(
            name="Gaming Monitor",
            sku="MN-003",
            price=Decimal("300.00"),
            status="ACTIVE",
            is_active=True,
        )
        self.p4 = Product.objects.create(
            name="Draft Stand", sku="ST-004", price=Decimal("20.00"), status="DRAFT", is_active=True
        )

        self.order1 = Order.objects.create(
            user=self.superuser,
            order_number="ORD-201",
            status="PENDING",
            total_amount=Decimal("150.00"),
        )
        self.order2 = Order.objects.create(
            user=self.superuser,
            order_number="ORD-202",
            status="DELIVERED",
            total_amount=Decimal("45.00"),
        )

    def _get_products(self, **query_params):
        request = self.factory.get("/api/shop/products/", query_params)
        request.session = {}
        force_authenticate(request, user=self.superuser)
        return self.product_view(request)

    def _get_orders(self, **query_params):
        request = self.factory.get("/api/shop/orders/", query_params)
        request.session = {}
        force_authenticate(request, user=self.superuser)
        return self.order_view(request)

    def _get_items(self, response):
        if isinstance(response.data, dict):
            return response.data.get("results", response.data.get("data", {}).get("items", []))
        return response.data

    def test_filter_price_gte_and_lte(self):
        response = self._get_products(price__gte="50.00", price__lte="200.00")
        assert response.status_code == 200
        items = self._get_items(response)
        skus = [p["sku"] for p in items]
        assert skus == ["KB-001"]

    def test_filter_price_range(self):
        response = self._get_products(price__range="40.00,200.00")
        assert response.status_code == 200
        items = self._get_items(response)
        skus = {p["sku"] for p in items}
        assert skus == {"KB-001", "MS-002"}

    def test_filter_status_in(self):
        # Multi status in
        response = self._get_products(status__in="DRAFT,ACTIVE")
        assert response.status_code == 200
        items = self._get_items(response)
        skus = {p["sku"] for p in items}
        assert len(skus) == 4

        # Single status in
        response_single = self._get_products(status__in="DRAFT")
        assert response_single.status_code == 200
        items_single = self._get_items(response_single)
        skus_single = [p["sku"] for p in items_single]
        assert skus_single == ["ST-004"]

    def test_filter_name_icontains(self):
        response = self._get_products(name__icontains="keyboard")
        assert response.status_code == 200
        items = self._get_items(response)
        skus = [p["sku"] for p in items]
        assert skus == ["KB-001"]

    def test_order_filter_total_amount_and_status(self):
        response = self._get_orders(total_amount__gte="100.00", status="PENDING")
        assert response.status_code == 200
        items = self._get_items(response)
        assert len(items) == 1
        assert items[0]["order_number"] == "ORD-201"

    def test_order_filter_total_amount_range(self):
        response = self._get_orders(total_amount__range="30.00,50.00")
        assert response.status_code == 200
        items = self._get_items(response)
        assert len(items) == 1
        assert items[0]["order_number"] == "ORD-202"

    def test_no_n_plus_one_queries_on_filtered_list(self, django_assert_num_queries):
        # O(1) query count regardless of order count (count query + slice + prefetch)
        with django_assert_num_queries(3):
            response = self._get_orders(total_amount__gte="10.00")
            assert response.status_code == 200
            assert len(self._get_items(response)) == 2
