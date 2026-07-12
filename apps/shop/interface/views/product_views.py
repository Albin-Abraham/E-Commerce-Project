from core.base_views.api_views import BaseAPIView
from apps.shop.infrastructure.models.product import Product
from apps.shop.infrastructure.serializers.product_serializers import ProductSerializer


class ProductViewSet(BaseAPIView):
    model = Product
    serializer_class = ProductSerializer
    entity_name = "Product"
    view_id = "SHOP_PRODUCT_MGMT"

    paginate = True
    supports_soft_delete = True

    search_fields = ["name", "sku", "description"]
    filter_fields = [("name", "name"), ("sku", "sku"), ("is_active", "is_active"), ("category", "category")]
    orderby = "name"
