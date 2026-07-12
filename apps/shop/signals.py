from django.db.models.signals import post_save
from django.dispatch import Signal, receiver

from apps.shop.infrastructure.models.order import Order

# Custom signals
order_confirmed = Signal()
order_cancelled = Signal()
product_activated = Signal()
product_deactivated = Signal()


@receiver(post_save, sender=Order)
def handle_order_status_change(sender, instance, created, **kwargs):
    """Observer: React to order status changes."""
    if not created:
        if instance.status == Order.StatusChoices.CONFIRMED:
            order_confirmed.send(sender=instance.__class__, order=instance)
        elif instance.status == Order.StatusChoices.CANCELLED:
            order_cancelled.send(sender=instance.__class__, order=instance)


@receiver(order_confirmed)
def log_order_confirmation(sender, order, **kwargs):
    """Observer: Log order confirmation."""
    from core.base_models.system_log import SystemLogEntry
    SystemLogEntry.objects.create(
        level="INFO",
        module="shop.orders",
        message=f"Order {order.order_number} confirmed",
        payload={"order_id": str(order.id), "total": str(order.total_amount)},
    )
