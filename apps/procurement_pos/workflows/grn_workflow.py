import logging
from django.db import models, transaction
from django.core.exceptions import ValidationError
from apps.procurement_pos.models.procurement import GoodsReceivedNote, PurchaseOrder
from apps.shop.infrastructure.models.inventory import Inventory, Batch

logger = logging.getLogger(__name__)


class GRNWorkflow:
    """
    Workflow State Machine & Stock Movement Operations for Goods Received Notes (GRN).
    """

    @classmethod
    @transaction.atomic
    def process_and_receive(cls, grn_id: str, received_by_user) -> GoodsReceivedNote:
        """
        Executes physical inventory stock increments, creates batches if applicable, and updates PO state.
        """
        grn = GoodsReceivedNote.objects.select_for_update().select_related("purchase_order", "warehouse").get(pk=grn_id)
        if grn.status == GoodsReceivedNote.GRNStatus.COMPLETED:
            raise ValidationError(f"GRN #{grn.grn_number} is already COMPLETED.")

        po = grn.purchase_order
        for item in po.items.all():
            # Update or create Inventory record atomically
            inv, created = Inventory.objects.get_or_create(
                variant=item.variant,
                warehouse=grn.warehouse,
                defaults={"quantity": item.quantity_ordered}
            )
            if not created:
                inv.quantity = models.F("quantity") + item.quantity_ordered
                inv.save(update_fields=["quantity", "updated_at"])

            item.quantity_received += item.quantity_ordered
            item.save(update_fields=["quantity_received", "updated_at"])

        grn.status = GoodsReceivedNote.GRNStatus.COMPLETED
        grn.received_by = received_by_user
        grn.save(update_fields=["status", "received_by", "updated_at"])

        po.status = PurchaseOrder.POStatus.COMPLETED
        po.save(update_fields=["status", "updated_at"])

        logger.info(f"GRN #{grn.grn_number} processed successfully by user {received_by_user.id}")
        return grn
