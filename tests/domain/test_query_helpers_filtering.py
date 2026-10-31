import datetime
from decimal import Decimal

import pytest
from django.db import models

from core.admin.helpers.query_helpers import (
    FilterField,
    FilterSchema,
    filter_queryset,
)


class DummyModel(models.Model):
    name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = "core"


class TestFilterFieldUnit:
    """Unit tests for FilterField auto-inference and coerce_lookup."""

    def test_default_lookup_inference(self):
        dec_field = FilterField(type=Decimal)
        assert "gte" in dec_field.lookups
        assert "lte" in dec_field.lookups
        assert "range" in dec_field.lookups
        assert "in" in dec_field.lookups
        assert "isnull" in dec_field.lookups

        dt_field = FilterField(type=datetime.datetime)
        assert "range" in dt_field.lookups
        assert "date" in dt_field.lookups
        assert "year" in dt_field.lookups

        str_field = FilterField(type=str)
        assert "icontains" in str_field.lookups
        assert "exact" in str_field.lookups
        assert "in" in str_field.lookups

        bool_field = FilterField(type=bool)
        assert bool_field.lookups == frozenset(["exact", "isnull"])

    def test_coerce_lookup_range(self):
        field = FilterField(type=Decimal)
        res = field.coerce_lookup("range", "10.50,99.99")
        assert res == (Decimal("10.50"), Decimal("99.99"))

        # Malformed range raises ValueError
        with pytest.raises(ValueError):
            field.coerce_lookup("range", "10.50")
        with pytest.raises(ValueError):
            field.coerce_lookup("range", "10,20,30")

    def test_coerce_lookup_in_single_and_multi(self):
        str_field = FilterField(type=str)
        # Single value
        res_single = str_field.coerce_lookup("in", "ACTIVE")
        assert res_single == ["ACTIVE"]

        # Multiple values
        res_multi = str_field.coerce_lookup("in", "ACTIVE,PENDING,SHIPPED")
        assert res_multi == ["ACTIVE", "PENDING", "SHIPPED"]

        # Int field
        int_field = FilterField(type=int)
        assert int_field.coerce_lookup("in", "1,2,3") == [1, 2, 3]

    def test_coerce_lookup_isnull(self):
        # Even on datetime/Decimal, isnull must coerce to boolean
        dt_field = FilterField(type=datetime.datetime)
        assert dt_field.coerce_lookup("isnull", "true") is True
        assert dt_field.coerce_lookup("isnull", "1") is True
        assert dt_field.coerce_lookup("isnull", "false") is False
        assert dt_field.coerce_lookup("isnull", "0") is False

    def test_coerce_lookup_date(self):
        dt_field = FilterField(type=datetime.datetime)
        res = dt_field.coerce_lookup("date", "2026-10-31")
        assert res == datetime.date(2026, 10, 31)

        with pytest.raises(ValueError):
            dt_field.coerce_lookup("date", "not-a-date")


class TestFilterSchemaResolution:
    """Tests for FilterSchema field and lookup resolution."""

    def test_get_field_resolution(self):
        schema = FilterSchema(
            name=FilterField(type=str),
            price=FilterField(type=Decimal),
            created_at=FilterField(type=datetime.datetime),
        )

        # Exact match
        field, lookup, model_field = schema.get_field("name")
        assert lookup == "exact"
        assert model_field == "name"

        # Lookup suffix
        field, lookup, model_field = schema.get_field("price__gte")
        assert lookup == "gte"
        assert model_field == "price"

        field, lookup, model_field = schema.get_field("created_at__range")
        assert lookup == "range"
        assert model_field == "created_at"

        field, lookup, model_field = schema.get_field("created_at__date")
        assert lookup == "date"
        assert model_field == "created_at"

        # Disallowed lookup
        field, lookup, model_field = schema.get_field("price__invalid_op")
        assert field is None

        # Unregistered field
        field, lookup, model_field = schema.get_field("unregistered_field")
        assert field is None


@pytest.mark.django_db
class TestFilterQuerysetIntegration:
    """Integration tests filtering Product model records."""

    def setup_method(self):
        from apps.shop.infrastructure.models.product import Product

        Product.objects.all().delete()
        self.p1 = Product.objects.create(
            name="Alpha Laptop", sku="SKU-001", price=Decimal("100.00"), status="ACTIVE"
        )
        self.p2 = Product.objects.create(
            name="Beta Mouse", sku="SKU-002", price=Decimal("25.00"), status="ACTIVE"
        )
        self.p3 = Product.objects.create(
            name="Gamma Keyboard", sku="SKU-003", price=Decimal("50.00"), status="DRAFT"
        )

        self.schema = FilterSchema(
            name=FilterField(type=str),
            sku=FilterField(type=str),
            price=FilterField(type=Decimal),
            status=FilterField(type=str),
            created_at=FilterField(type=datetime.datetime),
        )

    def test_filter_gte_lte_comparison(self):
        from apps.shop.infrastructure.models.product import Product

        qs = filter_queryset(
            Product.objects.all(),
            filter_schema=self.schema,
            field_search={"price__gte": "50.00"},
        )
        assert set(qs.values_list("sku", flat=True)) == {"SKU-001", "SKU-003"}

        qs2 = filter_queryset(
            Product.objects.all(),
            filter_schema=self.schema,
            field_search={"price__lt": "50.00"},
        )
        assert list(qs2.values_list("sku", flat=True)) == ["SKU-002"]

    def test_filter_range(self):
        from apps.shop.infrastructure.models.product import Product

        qs = filter_queryset(
            Product.objects.all(),
            filter_schema=self.schema,
            field_search={"price__range": "25.00,50.00"},
        )
        assert set(qs.values_list("sku", flat=True)) == {"SKU-002", "SKU-003"}

    def test_filter_in_single_and_multi(self):
        from apps.shop.infrastructure.models.product import Product

        # Single item in
        qs_single = filter_queryset(
            Product.objects.all(),
            filter_schema=self.schema,
            field_search={"status__in": "DRAFT"},
        )
        assert list(qs_single.values_list("sku", flat=True)) == ["SKU-003"]

        # Multi item in
        qs_multi = filter_queryset(
            Product.objects.all(),
            filter_schema=self.schema,
            field_search={"status__in": "ACTIVE,DRAFT"},
        )
        assert qs_multi.count() == 3

    def test_filter_icontains(self):
        from apps.shop.infrastructure.models.product import Product

        qs = filter_queryset(
            Product.objects.all(),
            filter_schema=self.schema,
            field_search={"name__icontains": "laptop"},
        )
        assert list(qs.values_list("sku", flat=True)) == ["SKU-001"]

    def test_unregistered_filter_field_ignored(self):
        from apps.shop.infrastructure.models.product import Product

        qs = filter_queryset(
            Product.objects.all(),
            filter_schema=self.schema,
            field_search={"secret_field": "exploit"},
        )
        # Should not crash, and should not filter by unauthorized field
        assert qs.count() == 3
