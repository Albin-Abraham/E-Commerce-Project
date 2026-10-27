from core.base_views.api_views import BaseAPIView
from core.admin.helpers.query_helpers import FilterSchema, FilterField, LOOKUP_OPERATORS
from apps.shop.infrastructure.models.product import Product
from apps.shop.infrastructure.models.variant import ProductVariant
from apps.shop.infrastructure.models.brand import Brand
from apps.shop.infrastructure.serializers.product_serializers import ProductSerializer, ProductVariantSerializer
from apps.shop.infrastructure.serializers.shop_serializers import BrandSerializer


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
        return Product.objects.select_related("brand", "category").prefetch_related("variants")


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
        return ProductVariant.objects.select_related("product")
