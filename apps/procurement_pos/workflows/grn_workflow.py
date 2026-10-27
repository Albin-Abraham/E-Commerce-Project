import logging

from django.core.exceptions import ValidationError
from django.db import transaction

from apps.procurement_pos.models.procurement import GoodsReceivedNote, PurchaseOrder
from apps.shop.infrastructure.models.inventory import Inventory, StockMovement

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
        grn = (
            GoodsReceivedNote.objects.select_for_update()
            .select_related("purchase_order", "warehouse")
            .get(pk=grn_id)
        )
        if grn.status == GoodsReceivedNote.GRNStatus.COMPLETED:
            raise ValidationError(f"GRN #{grn.grn_number} is already COMPLETED.")

        po = grn.purchase_order
        for item in po.items.all():
            # Update or create Inventory record atomically
            inv, created = Inventory.objects.get_or_create(
                variant=item.variant,
                warehouse=grn.warehouse,
                defaults={"quantity": item.quantity_ordered, "unit_cost": item.unit_cost},
            )
            if not created:
                inv.quantity = inv.quantity + item.quantity_ordered
                if item.unit_cost:
                    inv.unit_cost = item.unit_cost
                inv.save(update_fields=["quantity", "unit_cost", "updated_at"])

            StockMovement.objects.create(
                inventory=inv,
                variant=item.variant,
                warehouse=grn.warehouse,
                movement_type=StockMovement.MovementType.PURCHASE_RECEIPT,
                quantity_delta=item.quantity_ordered,
                balance_after=inv.quantity,
                unit_cost=item.unit_cost or 0.0,
                reference_type="GoodsReceivedNote",
                reference_id=str(grn.id),
            )

            item.quantity_received += item.quantity_ordered
            item.save(update_fields=["quantity_received", "updated_at"])

        grn.status = GoodsReceivedNote.GRNStatus.COMPLETED
        grn.received_by = received_by_user
        grn.save(update_fields=["status", "received_by", "updated_at"])

        po.status = PurchaseOrder.POStatus.COMPLETED
        po.save(update_fields=["status", "updated_at"])

        logger.info(f"GRN #{grn.grn_number} processed successfully by user {received_by_user.id}")
        return grn
