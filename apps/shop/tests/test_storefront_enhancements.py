from decimal import Decimal

import pytest
from django.contrib.contenttypes.models import ContentType
from rest_framework.test import APIRequestFactory

from apps.shop.infrastructure.models.brand import Brand
from apps.shop.infrastructure.models.catalog import Catalog, CatalogItem
from apps.shop.infrastructure.models.category import Category
from apps.shop.infrastructure.models.inventory import Inventory
from apps.shop.infrastructure.models.polymorphic import Media, Review
from apps.shop.infrastructure.models.product import Product
from apps.shop.infrastructure.models.variant import ProductVariant
from apps.shop.infrastructure.serializers.catalog_serializers import CatalogItemSerializer
from apps.shop.infrastructure.serializers.product_serializers import (
    ProductSerializer,
    ProductVariantSerializer,
)
from apps.shop.interface.views.product_views import ProductFacetsView
from tests.factories.user import UserFactory


@pytest.mark.django_db
class TestStorefrontProductEnrichment:
    def setup_method(self):
        self.factory = APIRequestFactory()
        self.user = UserFactory(is_superuser=True)
        self.brand = Brand.objects.create(name="Acme Corp", slug="acme-corp")
        self.category = Category.objects.create(name="Apparel", slug="apparel")
        self.product = Product.objects.create(
            name="Pro Running Shoe",
            sku="RUN-PRO-001",
            price=Decimal("120.00"),
            brand=self.brand,
            category=self.category,
        )

    def test_product_serializer_options_matrix_and_stock(self):
        # Create 2 variants with attributes
        v1 = ProductVariant.objects.create(
            product=self.product,
            sku="RUN-PRO-BLK-42",
            price=Decimal("120.00"),
            attributes={"Color": "Black", "Size": "42"},
            is_active=True,
        )
        v2 = ProductVariant.objects.create(
            product=self.product,
            sku="RUN-PRO-RED-43",
            price=Decimal("125.00"),
            attributes={"Color": "Red", "Size": "43"},
            is_active=True,
        )

        # Initially stock is 0
        serializer = ProductSerializer(self.product)
        data = serializer.data
        assert data["available_stock"] == 0
        assert data["is_in_stock"] is False
        assert "Color" in data["options_matrix"]
        assert "Black" in data["options_matrix"]["Color"]
        assert "Red" in data["options_matrix"]["Color"]
        assert "42" in data["options_matrix"]["Size"]
        assert "43" in data["options_matrix"]["Size"]

        # Add inventory to v1 (qty 15, reserved 3 -> available 12)
        Inventory.objects.create(
            variant=v1,
            quantity=15,
            reserved_quantity=3,
        )
        # Add inventory to v2 (qty 5, reserved 0 -> available 5)
        Inventory.objects.create(
            variant=v2,
            quantity=5,
            reserved_quantity=0,
        )

        # Verify variant serializer stock
        v1_data = ProductVariantSerializer(v1).data
        assert v1_data["available_stock"] == 12
        assert v1_data["is_in_stock"] is True

        # Verify product serializer stock aggregation (12 + 5 = 17)
        prod_data = ProductSerializer(self.product).data
        assert prod_data["available_stock"] == 17
        assert prod_data["is_in_stock"] is True

    def test_product_and_variant_media_serialization_and_fallback(self):
        # Create media for product
        prod_ct = ContentType.objects.get_for_model(Product)
        Media.objects.create(
            content_type=prod_ct,
            object_id=str(self.product.pk),
            url="https://cdn.example.com/shoe-front.jpg",
            media_type="IMAGE",
            alt_text="Shoe front view",
            sort_order=0,
        )
        Media.objects.create(
            content_type=prod_ct,
            object_id=str(self.product.pk),
            url="https://cdn.example.com/shoe-side.jpg",
            media_type="IMAGE",
            alt_text="Shoe side view",
            sort_order=1,
        )

        prod_data = ProductSerializer(self.product).data
        assert len(prod_data["images"]) == 2
        assert prod_data["images"][0]["url"] == "https://cdn.example.com/shoe-front.jpg"
        assert prod_data["images"][0]["is_primary"] is True
        assert prod_data["images"][1]["is_primary"] is False

        # Create variant without its own media -> should fallback to parent product images
        v1 = ProductVariant.objects.create(
            product=self.product,
            sku="RUN-PRO-FALLBACK",
            price=Decimal("120.00"),
        )
        v1_data = ProductVariantSerializer(v1).data
        assert len(v1_data["images"]) == 2
        assert v1_data["images"][0]["url"] == "https://cdn.example.com/shoe-front.jpg"

    def test_product_rating_summary(self):
        prod_ct = ContentType.objects.get_for_model(Product)
        # Add reviews: 5.0 and 4.0 -> avg 4.5
        Review.objects.create(
            content_type=prod_ct,
            object_id=str(self.product.pk),
            rating=Decimal("5.0"),
            is_approved=True,
            comment="Awesome shoes!",
        )
        Review.objects.create(
            content_type=prod_ct,
            object_id=str(self.product.pk),
            rating=Decimal("4.0"),
            is_approved=True,
            comment="Very comfortable.",
        )
        # Unapproved review should be excluded
        Review.objects.create(
            content_type=prod_ct,
            object_id=str(self.product.pk),
            rating=Decimal("1.0"),
            is_approved=False,
            comment="Spam review",
        )

        data = ProductSerializer(self.product).data
        summary = data["rating_summary"]
        assert summary["review_count"] == 2
        assert summary["average_rating"] == 4.5

    def test_catalog_item_storefront_serialization(self):
        catalog = Catalog.objects.create(name="Summer Catalog", code="SUMMER-2026")
        item = CatalogItem.objects.create(
            catalog=catalog,
            product=self.product,
            is_new_arrival=True,
            is_budget_friendly=False,
            tags=["trending", "featured"],
        )

        item_data = CatalogItemSerializer(item).data
        assert "New Arrival" in item_data["badges"]
        assert "trending" in item_data["badges"]
        assert item_data["is_in_stock"] is False

    def test_product_facets_endpoint(self):
        # Create second product and brand/category for rich facets
        brand2 = Brand.objects.create(name="Nike", slug="nike")
        cat2 = Category.objects.create(name="Footwear", slug="footwear")
        Product.objects.create(
            name="Air Max",
            sku="NK-AM-001",
            price=Decimal("160.00"),
            brand=brand2,
            category=cat2,
        )

        view = ProductFacetsView.as_view()
        request = self.factory.get("/api/v1/shop/products/facets/")
        response = view(request)

        assert response.status_code == 200
        data = response.data["data"]
        assert data["total_products"] >= 2
        assert data["price_range"]["min"] <= 120.0
        assert data["price_range"]["max"] >= 160.0
        assert len(data["categories"]) >= 2
        assert len(data["brands"]) >= 2
