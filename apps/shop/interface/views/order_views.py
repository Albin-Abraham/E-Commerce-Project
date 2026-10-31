from datetime import datetime
from decimal import Decimal

from apps.shop.infrastructure.models.order import Order
from apps.shop.infrastructure.models.order_item import OrderItem
from apps.shop.infrastructure.serializers.order_serializers import (
    OrderItemSerializer,
    OrderSerializer,
)
from apps.shop.selectors.order_selectors import get_user_orders_qs
from core.admin.helpers.query_helpers import FilterField, FilterSchema
from core.base_views.api_views import BaseAPIView


class OrderViewSet(BaseAPIView):
    model = Order
    serializer_class = OrderSerializer
    entity_name = "Order"
    view_id = "SHOP_ORDER_MGMT"

    paginate = True
    supports_soft_delete = True

    search_fields = ["order_number", "status"]
    filter_schema = FilterSchema(
        order_number=FilterField(type=str),
        status=FilterField(type=str),
        user=FilterField(type=str),
        total_amount=FilterField(type=Decimal),
        created_at=FilterField(type=datetime),
    )
    orderby = "-created_at"

    def get_base_queryset(self):
        return get_user_orders_qs()


class OrderItemViewSet(BaseAPIView):
    model = OrderItem
    serializer_class = OrderItemSerializer
    entity_name = "OrderItem"
    view_id = "SHOP_ORDER_ITEM_MGMT"

    paginate = True

    search_fields = ["order__order_number"]
    filter_schema = FilterSchema(
        order=FilterField(type=str),
        product=FilterField(type=str),
        quantity=FilterField(type=int),
        unit_price=FilterField(type=Decimal),
        line_total=FilterField(type=Decimal),
        created_at=FilterField(type=datetime),
    )
    orderby = "-created_at"
