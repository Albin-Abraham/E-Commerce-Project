from typing import Dict, Any, Optional
from uuid import UUID
from decimal import Decimal
from django.db import transaction
from django.db.models import F
from core.admin.services.base_service import BaseService
from core.admin.utils.integrity.retry import retry_on_conflict
from apps.shop.infrastructure.models.order import Order
from apps.shop.infrastructure.models.order_item import OrderItem
from apps.shop.infrastructure.models.inventory import Inventory
from apps.shop.application.interfaces.order_interface import IOrderService


class OrderService(BaseService[Order], IOrderService):
    """Application service: Order business logic."""

    @classmethod
    @transaction.atomic
    def process_order(cls, order_data: Dict[str, Any], user_id: UUID) -> Dict[str, Any]:
        items_data = order_data.pop("items", [])
        order = cls.create(user_id=user_id, **order_data)

        total = Decimal("0")
        for item_data in items_data:
            item_data["order"] = order
            item = OrderItem(**item_data)
            item.line_total = item.quantity * item.unit_price
            item.save()
            total += item.line_total

            cls._reserve_stock(item.product_id, order.branch_id, item.quantity)

        order.total_amount = total
        order.status = Order.StatusChoices.CONFIRMED
        order.save()

        return {"id": str(order.id), "order_number": order.order_number, "total": str(total)}

    @classmethod
    def calculate_total(cls, items: list) -> Decimal:
        total = Decimal("0")
        for item in items:
            total += item["quantity"] * item["unit_price"]
        return total

    @classmethod
    @transaction.atomic
    def cancel_order(cls, order_id: UUID, user_id: UUID) -> bool:
        order = cls.get_object(order_id, user=user_id)
        if not order:
            return False

        if order.status == Order.StatusChoices.CANCELLED:
            return False

        for item in order.items.all():
            cls._release_stock(item.product_id, order.branch_id, item.quantity)

        order.status = Order.StatusChoices.CANCELLED
        order.save()
        return True

    @classmethod
    def get_order_summary(cls, order_id: UUID) -> Optional[Dict[str, Any]]:
        order = cls.get_object(order_id)
        if not order:
            return None
        return {
            "id": str(order.id),
            "order_number": order.order_number,
            "status": order.status,
            "total_amount": str(order.total_amount),
            "items_count": order.items.count(),
        }

    @classmethod
    @retry_on_conflict(max_retries=3)
    def _reserve_stock(cls, product_id: UUID, branch_id: UUID, quantity: int):
        Inventory.objects.filter(
            product_id=product_id,
            branch_id=branch_id,
        ).update(reserved_quantity=F("reserved_quantity") + quantity)

    @classmethod
    @retry_on_conflict(max_retries=3)
    def _release_stock(cls, product_id: UUID, branch_id: UUID, quantity: int):
        Inventory.objects.filter(
            product_id=product_id,
            branch_id=branch_id,
        ).update(reserved_quantity=F("reserved_quantity") - quantity)
