import logging
from django.db import transaction
from django.core.exceptions import ValidationError
from apps.shop.infrastructure.models.inventory import StockTransfer, Inventory

logger = logging.getLogger(__name__)


class StockTransferWorkflow:
    """
    Workflow State Machine & Movement Engine for Inter-Warehouse Stock Transfers.
    """

    @classmethod
    @transaction.atomic
    def dispatch_transfer(cls, transfer_id: str, user) -> StockTransfer:
        st = StockTransfer.objects.select_for_update().select_related("from_warehouse", "to_warehouse").get(pk=transfer_id)
        if st.status != StockTransfer.TransferStatus.DRAFT:
            raise ValidationError(f"Cannot dispatch StockTransfer in state {st.status}. Must be DRAFT.")

        st.status = StockTransfer.TransferStatus.IN_TRANSIT
        st.save(update_fields=["status", "updated_at"])
        logger.info(f"StockTransfer #{st.transfer_number} dispatched from {st.from_warehouse.name} to {st.to_warehouse.name}")
        return st

    @classmethod
    @transaction.atomic
    def receive_transfer(cls, transfer_id: str, items_qty_map: dict, user) -> StockTransfer:
        """
        Completes stock transfer by deducting stock from source warehouse and adding to destination warehouse.
        """
        st = StockTransfer.objects.select_for_update().select_related("from_warehouse", "to_warehouse").get(pk=transfer_id)
        if st.status != StockTransfer.TransferStatus.IN_TRANSIT:
            raise ValidationError(f"Cannot receive StockTransfer in state {st.status}. Must be IN_TRANSIT.")

        for variant_id, qty in items_qty_map.items():
            # Deduct from source warehouse
            source_inv = Inventory.objects.get(variant_id=variant_id, warehouse=st.from_warehouse)
            if source_inv.quantity < qty:
                raise ValidationError(f"Insufficient stock at source warehouse {st.from_warehouse.name} for variant {variant_id}")
            source_inv.quantity -= qty
            source_inv.save(update_fields=["quantity", "updated_at"])

            # Add to target warehouse
            target_inv, created = Inventory.objects.get_or_create(
                variant_id=variant_id,
                warehouse=st.to_warehouse,
                defaults={"quantity": qty}
            )
            if not created:
                target_inv.quantity += qty
                target_inv.save(update_fields=["quantity", "updated_at"])

        st.status = StockTransfer.TransferStatus.COMPLETED
        st.save(update_fields=["status", "updated_at"])
        logger.info(f"StockTransfer #{st.transfer_number} successfully received at {st.to_warehouse.name}")
        return st
