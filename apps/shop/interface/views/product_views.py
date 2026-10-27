from django.db.models import Count, Max, Min, Q
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.shop.infrastructure.models.brand import Brand
from apps.shop.infrastructure.models.category import Category
from apps.shop.infrastructure.models.product import Product
from apps.shop.infrastructure.models.variant import ProductVariant
from apps.shop.infrastructure.serializers.product_serializers import (
    ProductSerializer,
    ProductVariantSerializer,
)
from apps.shop.infrastructure.serializers.shop_serializers import BrandSerializer
from core.admin.helpers.query_helpers import LOOKUP_OPERATORS, FilterField, FilterSchema
from core.base_views.api_views import BaseAPIView


class BrandViewSet(BaseAPIView):
    model = Brand
    serializer_class = BrandSerializer
    entity_name = "Brand"
    view_id = "SHOP_BRAND_MGMT"
    filter_schema = FilterSchema(
        name=FilterField(type=str, lookups=["exact", "icontains"]),
        is_active=FilterField(type=bool),
    )


class ProductViewSet(BaseAPIView):
    """
    Product Catalog API ViewSet.
    Integrated with FilterSchema for high-performance multi-attribute, price range, brand, category,
    and metadata filter queries.
    GET requests route through PrimaryReplicaRouter automatically.
    """

    model = Product
    serializer_class = ProductSerializer
    entity_name = "Product"
    view_id = "SHOP_PRODUCT_MGMT"

    paginate = True
    supports_soft_delete = True

    search_fields = ["name", "sku", "slug"]
    filter_fields = [
        ("name", "name"),
        ("sku", "sku"),
        ("status", "status"),
        ("is_active", "is_active"),
        ("category", "category_id"),
        ("brand", "brand_id"),
    ]
    orderby = "name"

    filter_schema = FilterSchema(
        name=FilterField(type=str, lookups=["exact", "icontains"]),
        sku=FilterField(type=str, lookups=["exact", "icontains"]),
        status=FilterField(type=str, lookups=["exact"]),
        is_active=FilterField(type=bool),
        category=FilterField(type=str, lookups=["exact"]),
        brand=FilterField(type=str, lookups=["exact"]),
        price=FilterField(type=float, lookups=["exact", "gte", "lte", "gt", "lt"]),
        metadata=FilterField(type=str, lookups=LOOKUP_OPERATORS),
    )

    def get_base_queryset(self):
        return Product.objects.select_related("brand", "category").prefetch_related(
            "variants__inventory_records", "legacy_inventory_records"
        )


class ProductVariantViewSet(BaseAPIView):
    """
    Product Variants API ViewSet.
    Integrated with FilterSchema for attribute and specifications filtering.
    """

    model = ProductVariant
    serializer_class = ProductVariantSerializer
    entity_name = "ProductVariant"
    view_id = "SHOP_VARIANT_MGMT"

    paginate = True
    search_fields = ["sku", "barcode"]
    filter_schema = FilterSchema(
        sku=FilterField(type=str, lookups=["exact", "icontains"]),
        status=FilterField(type=str, lookups=["exact"]),
        is_active=FilterField(type=bool),
        price=FilterField(type=float, lookups=["exact", "gte", "lte"]),
        attributes=FilterField(type=str, lookups=LOOKUP_OPERATORS),
    )

    def get_base_queryset(self):
        return ProductVariant.objects.select_related("product").prefetch_related(
            "inventory_records"
        )


class ProductFacetsView(APIView):
    """
    Storefront Aggregated Product Facets API.
    Returns dynamic faceted counts for categories, brands, price ranges,
    in-stock availability, and variant attributes.
    Supports query parameter filtering (e.g., category, brand, search) to return contextual facets.
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        qs = Product.objects.filter(is_active=True)

        category_id = request.query_params.get("category")
        if category_id:
            qs = qs.filter(category_id=category_id)

        brand_id = request.query_params.get("brand")
        if brand_id:
            qs = qs.filter(brand_id=brand_id)

        search = request.query_params.get("search")
        if search:
            qs = qs.filter(Q(name__icontains=search) | Q(sku__icontains=search))

        price_stats = qs.aggregate(min_price=Min("price"), max_price=Max("price"))
        min_p = float(price_stats.get("min_price") or 0.0)
        max_p = float(price_stats.get("max_price") or 0.0)

        # Categories with product counts
        cat_counts = (
            Category.objects.filter(products__in=qs, is_active=True)
            .annotate(count=Count("products", filter=Q(products__in=qs)))
            .values("id", "name", "slug", "count")
            .order_by("-count", "name")
        )

        # Brands with product counts
        brand_counts = (
            Brand.objects.filter(products__in=qs, is_active=True)
            .annotate(count=Count("products", filter=Q(products__in=qs)))
            .values("id", "name", "slug", "count")
            .order_by("-count", "name")
        )

        # Attributes from active variants
        variants = (
            ProductVariant.objects.filter(product__in=qs, is_active=True)
            .exclude(attributes={})
            .values_list("attributes", flat=True)
        )
        attributes_map = {}
        for attr in variants:
            if isinstance(attr, dict):
                for k, v in attr.items():
                    key = str(k).strip()
                    val = str(v).strip()
                    if key not in attributes_map:
                        attributes_map[key] = set()
                    attributes_map[key].add(val)

        formatted_attributes = {k: sorted(list(v)) for k, v in sorted(attributes_map.items())}

        # Availability count
        in_stock_count = 0
        out_of_stock_count = 0
        for prod in qs.prefetch_related("variants__inventory_records", "legacy_inventory_records"):
            has_stock = False
            vars_list = prod.variants.all()
            if vars_list.exists():
                for v in vars_list:
                    avail = sum(
                        max(0, inv.quantity - inv.reserved_quantity)
                        for inv in v.inventory_records.all()
                    )
                    if avail > 0:
                        has_stock = True
                        break
            else:
                avail = sum(
                    max(0, inv.quantity - inv.reserved_quantity)
                    for inv in prod.legacy_inventory_records.all()
                )
                if avail > 0:
                    has_stock = True

            if has_stock:
                in_stock_count += 1
            else:
                out_of_stock_count += 1

        total_products = qs.count()

        return Response(
            {
                "success": True,
                "data": {
                    "total_products": total_products,
                    "price_range": {
                        "min": min_p,
                        "max": max_p,
                    },
                    "categories": list(cat_counts),
                    "brands": list(brand_counts),
                    "attributes": formatted_attributes,
                    "availability": {
                        "in_stock": in_stock_count,
                        "out_of_stock": out_of_stock_count,
                    },
                },
            }
        )
