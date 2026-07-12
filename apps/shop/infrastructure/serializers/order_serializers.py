from core.base_serializers.base_serializers import BaseModelSerializer
from apps.shop.infrastructure.models.order import Order
from apps.shop.infrastructure.models.order_item import OrderItem


class OrderItemSerializer(BaseModelSerializer):
    class Meta:
        model = OrderItem
        fields = [
            "id", "product", "quantity", "unit_price", "line_total",
        ]
        read_only_fields = ["id", "line_total"]


class OrderSerializer(BaseModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            "id", "user", "order_number", "status", "total_amount",
            "items", "company", "branch",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "order_number", "total_amount", "created_at", "updated_at"]
