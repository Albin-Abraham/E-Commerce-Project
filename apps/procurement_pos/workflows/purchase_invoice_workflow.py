import logging
from django.db import transaction
from django.core.exceptions import ValidationError
from apps.procurement_pos.models.procurement import PurchaseInvoice, GoodsReceivedNote

logger = logging.getLogger(__name__)


class PurchaseInvoiceWorkflow:
    """
    Workflow State Machine for Purchase Invoices & 3-Way Matching Engine.
    """

    @classmethod
    @transaction.atomic
    def run_three_way_match(cls, invoice_id: str, user) -> PurchaseInvoice:
        inv = PurchaseInvoice.objects.select_for_update().select_related("purchase_order", "goods_received_note").get(pk=invoice_id)
        po = inv.purchase_order
        grn = inv.goods_received_note

        if not grn or grn.status != GoodsReceivedNote.GRNStatus.COMPLETED:
            inv.status = PurchaseInvoice.InvoiceStatus.MISMATCH
            inv.save(update_fields=["status", "updated_at"])
            logger.warning(f"PurchaseInvoice #{inv.invoice_number} 3-Way Match FAILED: Missing/Incomplete GRN")
            return inv

        if abs(po.total_amount - inv.billed_amount) < 0.01:
            inv.status = PurchaseInvoice.InvoiceStatus.MATCHED
            inv.save(update_fields=["status", "updated_at"])
            logger.info(f"PurchaseInvoice #{inv.invoice_number} 3-Way Match SUCCESS by user {user.id}")
            return inv
        else:
            inv.status = PurchaseInvoice.InvoiceStatus.MISMATCH
            inv.save(update_fields=["status", "updated_at"])
            logger.warning(f"PurchaseInvoice #{inv.invoice_number} 3-Way Match FAILED: PO Amount ({po.total_amount}) != Billed ({inv.billed_amount})")
            return inv

    @classmethod
    @transaction.atomic
    def mark_as_paid(cls, invoice_id: str, user) -> PurchaseInvoice:
        inv = PurchaseInvoice.objects.select_for_update().get(pk=invoice_id)
        if inv.status != PurchaseInvoice.InvoiceStatus.MATCHED:
            raise ValidationError(f"Cannot mark PurchaseInvoice as PAID. Must be MATCHED (Current: {inv.status}).")

        inv.status = PurchaseInvoice.InvoiceStatus.PAID
        inv.save(update_fields=["status", "updated_at"])
        logger.info(f"PurchaseInvoice #{inv.invoice_number} marked as PAID by user {user.id}")
        return inv
