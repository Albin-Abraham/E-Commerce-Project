import logging

from django.core.exceptions import PermissionDenied, ValidationError
from django.utils import timezone

from apps.core_documents.models.documents import Document

logger = logging.getLogger(__name__)


class DocumentLifecycleEngine:
    ALLOWED_TRANSITIONS = {
        Document.DocumentStatus.DRAFT: [
            Document.DocumentStatus.SUBMITTED
        ],
        Document.DocumentStatus.SUBMITTED: [
            Document.DocumentStatus.UNDER_REVIEW,
            Document.DocumentStatus.APPROVED,
            Document.DocumentStatus.REJECTED
        ],
        Document.DocumentStatus.UNDER_REVIEW: [
            Document.DocumentStatus.APPROVED,
            Document.DocumentStatus.REJECTED
        ],
        Document.DocumentStatus.REJECTED: [
            Document.DocumentStatus.DRAFT,
            Document.DocumentStatus.SUBMITTED
        ],
        Document.DocumentStatus.APPROVED: [
            Document.DocumentStatus.DRAFT,
            Document.DocumentStatus.REJECTED
        ],
    }

    @classmethod
    def can_transition(cls, document: Document, new_status: str, actor) -> bool:
        current_status = document.status
        allowed_next = cls.ALLOWED_TRANSITIONS.get(current_status, [])
        if new_status not in allowed_next:
            return False

        if new_status in [
            Document.DocumentStatus.APPROVED,
            Document.DocumentStatus.REJECTED,
            Document.DocumentStatus.UNDER_REVIEW,
        ]:
            has_perm = actor.has_perm("core_documents.review_document")
            if not (actor.is_superuser or actor.is_staff or has_perm):
                return False

        return True

    @classmethod
    def transition_to(cls, document: Document, new_status: str, actor, reason=None) -> Document:
        current_status = document.status
        allowed_next = cls.ALLOWED_TRANSITIONS.get(current_status, [])
        if new_status not in allowed_next:
            raise ValidationError(
                f"Invalid transition from state '{current_status}' to '{new_status}'. "
                f"Allowed states: {', '.join(allowed_next)}"
            )

        if not cls.can_transition(document, new_status, actor):
            raise PermissionDenied(
                f"User '{actor}' is not authorized to transition document to state '{new_status}'."
            )

        is_sub = new_status == Document.DocumentStatus.SUBMITTED
        if is_sub:
            from apps.access_control.models import ApprovalChain
            has_db_chain = ApprovalChain.objects.filter(
                approval_type=document.definition.key,
                is_active=True,
            ).exists()
            if document.definition.approval_chain_config or has_db_chain:
                from apps.core_documents.services.workflow_engine import DocumentWorkflowEngine
                DocumentWorkflowEngine.initialize_workflow(document, actor)
                return document

        if new_status == Document.DocumentStatus.REJECTED and not reason:
            raise ValidationError("A rejection reason must be provided when rejecting a document.")

        document.status = new_status
        document.status_changed_at = timezone.now()
        document.status_changed_by = actor

        if new_status == Document.DocumentStatus.REJECTED:
            document.rejection_reason = reason
        else:
            document.rejection_reason = None

        document.save()
        logger.info(
            "Document '%s' (ID: %s) transitioned from %s to %s by %s",
            document.definition.label,
            document.id,
            current_status,
            new_status,
            actor
        )
        return document
