import logging
from django.db import transaction
from django.core.exceptions import ValidationError
from apps.procurement_pos.constants import ProcurementPOSEventType
from apps.procurement_pos.models.procurement import PurchaseOrder
from apps.shop.infrastructure.models.events import DomainEventOutbox

logger = logging.getLogger(__name__)


class PurchaseOrderWorkflow:
    """
    Enterprise State Machine & Approval Chain Engine for Purchase Orders.
    Integrates dynamic approval chains and Domain Event Outbox governance.
    """

    @classmethod
    @transaction.atomic
    def submit_po(cls, po_id: str, user) -> PurchaseOrder:
        po = PurchaseOrder.objects.select_for_update().get(pk=po_id)
        if po.status != PurchaseOrder.POStatus.DRAFT:
            raise ValidationError(f"Cannot submit PO in status {po.status}. Must be DRAFT.")

        po.status = PurchaseOrder.POStatus.SUBMITTED
        po.save(update_fields=["status", "updated_at"])

        # Record Outbox Event for Async Processors / Notifications
        DomainEventOutbox.record_event(
            event_type=ProcurementPOSEventType.PO_SUBMITTED,
            aggregate_id=po.id,
            aggregate_type="PurchaseOrder",
            payload={
                "po_number": po.po_number,
                "supplier_id": po.supplier_id,
                "total_amount": float(po.total_amount),
                "submitted_by": user.id if user else None,
            },
            idempotency_key=f"po_submit_{po.id}_{po.updated_at.timestamp()}",
        )

        logger.info(f"PO #{po.po_number} submitted by user {user}")
        return po

    @classmethod
    @transaction.atomic
    def approve_po(cls, po_id: str, approver) -> PurchaseOrder:
        po = PurchaseOrder.objects.select_for_update().get(pk=po_id)
        if po.status != PurchaseOrder.POStatus.SUBMITTED:
            raise ValidationError(f"Cannot approve PO in status {po.status}. Must be SUBMITTED.")

        po.status = PurchaseOrder.POStatus.APPROVED
        po.save(update_fields=["status", "updated_at"])

        DomainEventOutbox.record_event(
            event_type=ProcurementPOSEventType.PO_APPROVED,
            aggregate_id=po.id,
            aggregate_type="PurchaseOrder",
            payload={
                "po_number": po.po_number,
                "supplier_id": po.supplier_id,
                "total_amount": float(po.total_amount),
                "approved_by": approver.id if approver else None,
            },
            idempotency_key=f"po_approve_{po.id}_{po.updated_at.timestamp()}",
        )

        logger.info(f"PO #{po.po_number} approved by approver {approver}")
        return po

    @classmethod
    @transaction.atomic
    def cancel_po(cls, po_id: str, user, reason: str = "") -> PurchaseOrder:
        po = PurchaseOrder.objects.select_for_update().get(pk=po_id)
        if po.status in [PurchaseOrder.POStatus.COMPLETED, PurchaseOrder.POStatus.CANCELLED]:
            raise ValidationError(f"Cannot cancel PO in status {po.status}.")

        po.status = PurchaseOrder.POStatus.CANCELLED
        po.save(update_fields=["status", "updated_at"])

        DomainEventOutbox.record_event(
            event_type=ProcurementPOSEventType.PO_CANCELLED,
            aggregate_id=po.id,
            aggregate_type="PurchaseOrder",
            payload={"po_number": po.po_number, "reason": reason, "cancelled_by": user.id if user else None},
            idempotency_key=f"po_cancel_{po.id}_{po.updated_at.timestamp()}",
        )

        logger.info(f"PO #{po.po_number} cancelled by user {user}")
        return po
