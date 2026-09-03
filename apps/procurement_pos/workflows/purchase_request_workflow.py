import logging
from django.db import transaction
from django.core.exceptions import ValidationError
from apps.procurement_pos.models.procurement import PurchaseRequest

logger = logging.getLogger(__name__)


class PurchaseRequestWorkflow:
    """
    Workflow State Machine & Lifecycle Operations for Purchase Requests (Requisitions).
    """

    @classmethod
    @transaction.atomic
    def submit_request(cls, pr_id: str, user) -> PurchaseRequest:
        pr = PurchaseRequest.objects.select_for_update().get(pk=pr_id)
        if pr.status != PurchaseRequest.PRStatus.DRAFT:
            raise ValidationError(f"Cannot submit PR in state {pr.status}. Must be DRAFT.")

        pr.status = PurchaseRequest.PRStatus.SUBMITTED
        pr.save(update_fields=["status", "updated_at"])
        logger.info(f"PR #{pr.request_number} submitted by user {user.id}")
        return pr

    @classmethod
    @transaction.atomic
    def approve_request(cls, pr_id: str, approver) -> PurchaseRequest:
        pr = PurchaseRequest.objects.select_for_update().get(pk=pr_id)
        if pr.status != PurchaseRequest.PRStatus.SUBMITTED:
            raise ValidationError(f"Cannot approve PR in state {pr.status}. Must be SUBMITTED.")

        pr.status = PurchaseRequest.PRStatus.APPROVED
        pr.save(update_fields=["status", "updated_at"])
        logger.info(f"PR #{pr.request_number} approved by approver {approver.id}")
        return pr

    @classmethod
    @transaction.atomic
    def reject_request(cls, pr_id: str, rejector, reason: str = "") -> PurchaseRequest:
        pr = PurchaseRequest.objects.select_for_update().get(pk=pr_id)
        if pr.status not in [PurchaseRequest.PRStatus.SUBMITTED, PurchaseRequest.PRStatus.DRAFT]:
            raise ValidationError(f"Cannot reject PR in state {pr.status}.")

        pr.status = PurchaseRequest.PRStatus.REJECTED
        if reason:
            pr.notes = f"{pr.notes or ''}\n[REJECTED]: {reason}"
        pr.save(update_fields=["status", "notes", "updated_at"])
        logger.info(f"PR #{pr.request_number} rejected by user {rejector.id}")
        return pr
