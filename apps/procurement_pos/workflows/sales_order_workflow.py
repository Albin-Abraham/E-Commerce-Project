import logging
from django.db import transaction
from django.core.exceptions import ValidationError
from apps.procurement_pos.models.selling import SalesOrder, DeliveryNote

logger = logging.getLogger(__name__)


class SalesOrderWorkflow:
    """
    Workflow State Machine & Dispatch Operations for Sales Orders.
    """

    @classmethod
    @transaction.atomic
    def confirm_order(cls, order_id: str, user) -> SalesOrder:
        order = SalesOrder.objects.select_for_update().get(pk=order_id)
        if order.status != SalesOrder.OrderStatus.DRAFT:
            raise ValidationError(f"Cannot confirm SalesOrder in state {order.status}. Must be DRAFT.")

        order.status = SalesOrder.OrderStatus.CONFIRMED
        order.save(update_fields=["status", "updated_at"])
        logger.info(f"SalesOrder #{order.order_number} confirmed by user {user.id}")
        return order

    @classmethod
    @transaction.atomic
    def create_delivery_note(cls, order_id: str, warehouse, tracking_number: str = "", user=None) -> DeliveryNote:
        order = SalesOrder.objects.select_for_update().get(pk=order_id)
        if order.status not in [SalesOrder.OrderStatus.CONFIRMED, SalesOrder.OrderStatus.DISPATCHED]:
            raise ValidationError(f"Cannot generate Delivery Note for SalesOrder in state {order.status}.")

        delivery_note = DeliveryNote.objects.create(
            sales_order=order,
            warehouse=warehouse,
            tracking_number=tracking_number,
            status=DeliveryNote.DeliveryStatus.DISPATCHED,
        )

        order.status = SalesOrder.OrderStatus.DISPATCHED
        order.save(update_fields=["status", "updated_at"])
        logger.info(f"DeliveryNote #{delivery_note.delivery_number} generated for SalesOrder #{order.order_number}")
        return delivery_note
