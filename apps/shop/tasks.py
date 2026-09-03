import logging
from celery import shared_task
from django.db import models

from apps.shop.infrastructure.models.inventory import Inventory
from apps.shop.infrastructure.models.events import DomainEventOutbox

logger = logging.getLogger(__name__)


@shared_task(name="apps.shop.tasks.check_low_stock_alerts_task")
def check_low_stock_alerts_task():
    """
    Scans inventory for items where available stock is below reorder threshold.
    Logs warnings and triggers outbox events for replenishment.
    """
    low_stock_records = Inventory.objects.filter(
        quantity__lte=models.F("reserved_quantity") + models.F("reorder_point")
    ).select_related("product", "variant", "warehouse")

    alerts_triggered = 0
    for record in low_stock_records:
        available = record.available_quantity
        target_name = record.variant.sku if record.variant else (record.product.name if record.product else record.id)
        logger.warning(
            "LOW STOCK ALERT: Inventory '%s' (ID: %s) has available qty %d (reorder point %d).",
            target_name,
            record.id,
            available,
            record.reorder_point,
        )
        # Emit outbox event
        DomainEventOutbox.objects.create(
            event_type="INVENTORY_LOW_STOCK",
            version="1.0",
            entity_id=str(record.id),
            payload={
                "target_sku": target_name,
                "available_quantity": available,
                "reorder_point": record.reorder_point,
                "warehouse_id": str(record.warehouse.id) if record.warehouse else None,
            }
        )
        alerts_triggered += 1

    logger.info("Completed low stock check. Triggered %d alerts.", alerts_triggered)
    return {"alerts_triggered": alerts_triggered}


@shared_task(name="apps.shop.tasks.process_event_outbox_task")
def process_event_outbox_task():
    """
    Processes pending domain events from outbox.
    """
    pending_events = DomainEventOutbox.objects.filter(
        status=DomainEventOutbox.EventStatus.PENDING
    ).order_by("created_at")[:100]

    processed_count = 0
    for evt in pending_events:
        try:
            # Event dispatch logic (e.g. search indexing, recommendations, cache invalidation)
            logger.info("Processing event %s (%s)", evt.id, evt.event_type)
            evt.mark_processed()
            processed_count += 1
        except Exception as e:
            logger.error("Failed to process event %s: %s", evt.id, e)
            evt.mark_failed(str(e))

    return {"processed_count": processed_count}
