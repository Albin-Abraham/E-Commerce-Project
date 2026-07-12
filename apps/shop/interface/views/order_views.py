from core.base_views.api_views import BaseAPIView
from apps.shop.infrastructure.models.order import Order
from apps.shop.infrastructure.serializers.order_serializers import OrderSerializer


class OrderViewSet(BaseAPIView):
    model = Order
    serializer_class = OrderSerializer
    entity_name = "Order"
    view_id = "SHOP_ORDER_MGMT"

    paginate = True
    supports_soft_delete = True

    search_fields = ["order_number", "status"]
    filter_fields = [("status", "status"), ("user", "user")]
    orderby = "-created_at"
