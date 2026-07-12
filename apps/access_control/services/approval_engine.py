import logging
from datetime import timedelta
from django.utils import timezone
from django.contrib.contenttypes.models import ContentType
from apps.access_control.models import (
    ApprovalChain,
    ApprovalLevel,
    ApprovalRequest,
    ApprovalAction,
    ApprovalRequestStatus,
    ApprovalActionType,
)

logger = logging.getLogger(__name__)


class ApprovalEngine:
    """
    Orchestrator for the approval workflow.
    Handles chain resolution, condition matching, approver resolution,
    and state transitions.
    """

    @staticmethod
    def resolve_chain(approval_type: str, domain_object=None) -> ApprovalChain | None:
        """
        Find the best matching ApprovalChain for a given approval type.
        Chains are evaluated by priority (higher first).
        Optional domain_object narrows the search.
        """
        chains = ApprovalChain.objects.filter(
            approval_type=approval_type,
            is_active=True,
        ).order_by("-priority")

        if domain_object:
            ct = ContentType.objects.get_for_model(domain_object)
            chains = chains.filter(
                domain_type=ct,
                object_id=str(domain_object.pk),
            ) | chains.filter(domain_type__isnull=True)

        return chains.first()

    @staticmethod
    def _evaluate_conditions(chain: ApprovalChain, payload: dict) -> bool:
        """
        Evaluate chain conditions against the request payload.
        Conditions are JSON dict rules like {"amount_gt": 5000}.
        """
        if not chain.conditions:
            return True

        for key, threshold in chain.conditions.items():
            if key.endswith("_gt"):
                field = key[:-3]
                if payload.get(field, 0) <= threshold:
                    return False
            elif key.endswith("_gte"):
                field = key[:-4]
                if payload.get(field, 0) < threshold:
                    return False
            elif key.endswith("_lt"):
                field = key[:-3]
                if payload.get(field, 0) >= threshold:
                    return False
            elif key.endswith("_lte"):
                field = key[:-4]
                if payload.get(field, 0) > threshold:
                    return False
            elif key.endswith("_eq"):
                field = key[:-3]
                if payload.get(field) != threshold:
                    return False
            elif key.endswith("_in"):
                field = key[:-3]
                if payload.get(field) not in threshold:
                    return False

        return True

    @staticmethod
    def resolve_approver(level: ApprovalLevel):
        """
        Resolve the actual approver for an approval level.
        Returns (approver_object, approver_type) or (None, None).
        """
        if level.approver_by_type == "specific_user" and level.approver:
            return level.approver, "user"
        elif level.approver_by_type == "role" and level.approver:
            return level.approver, "role"

        # Fallback to fallback approver
        if level.fallback_approver_by_type == "specific_user" and level.fallback_approver:
            return level.fallback_approver, "user"
        elif level.fallback_approver_by_type == "role" and level.fallback_approver:
            return level.fallback_approver, "role"

        return None, None

    @staticmethod
    def submit(
        approval_type: str,
        submitter,
        content_object,
        payload: dict = None,
        domain_object=None,
    ) -> ApprovalRequest:
        """
        Submit a new approval request.
        Resolves the chain, validates conditions, and creates the request.
        """
        chain = ApprovalEngine.resolve_chain(approval_type, domain_object)
        if not chain:
            raise ValueError(f"No active approval chain found for type '{approval_type}'")

        if not ApprovalEngine._evaluate_conditions(chain, payload or {}):
            raise ValueError("Request payload does not meet chain conditions")

        ct = ContentType.objects.get_for_model(content_object)

        request_obj = ApprovalRequest.objects.create(
            chain=chain,
            submitter=submitter,
            content_type=ct,
            object_id=str(content_object.pk),
            payload=payload or {},
            current_level=1,
            status=ApprovalRequestStatus.PENDING,
        )

        logger.info(
            f"Approval request {request_obj.id} submitted by {submitter} "
            f"via chain '{chain.name}' (type={approval_type})"
        )

        return request_obj

    @staticmethod
    def approve(request: ApprovalRequest, approver, comment: str = "") -> ApprovalAction:
        """
        Process an approval action. Moves to next level or finalizes.
        """
        if request.status != ApprovalRequestStatus.PENDING:
            raise ValueError(f"Request is not pending (status={request.status})")

        level = request.chain.levels.filter(level=request.current_level).first()
        if not level:
            raise ValueError(f"Level {request.current_level} not found in chain")

        # Create the action
        action = ApprovalAction.objects.create(
            request=request,
            approver=approver,
            action_type=ApprovalActionType.APPROVE,
            comment=comment,
            level=request.current_level,
        )

        # Check if this is the last level
        max_level = request.chain.levels.order_by("-level").values_list("level", flat=True).first()
        if request.current_level >= max_level:
            # Final approval
            request.status = ApprovalRequestStatus.APPROVED
            request.decision_comment = comment
            request.resolved_at = timezone.now()
            request.save()
            logger.info(f"Request {request.id} fully approved at level {request.current_level}")
        else:
            # Move to next level
            request.current_level += 1
            request.status = ApprovalRequestStatus.PENDING
            request.save()
            logger.info(f"Request {request.id} approved at level {action.level}, moved to level {request.current_level}")

        return action

    @staticmethod
    def reject(request: ApprovalRequest, approver, comment: str = "") -> ApprovalAction:
        """
        Process a rejection. The request is immediately rejected.
        """
        if request.status != ApprovalRequestStatus.PENDING:
            raise ValueError(f"Request is not pending (status={request.status})")

        action = ApprovalAction.objects.create(
            request=request,
            approver=approver,
            action_type=ApprovalActionType.REJECT,
            comment=comment,
            level=request.current_level,
        )

        request.status = ApprovalRequestStatus.REJECTED
        request.decision_comment = comment
        request.resolved_at = timezone.now()
        request.save()

        logger.info(f"Request {request.id} rejected at level {request.current_level} by {approver}")

        return action

    @staticmethod
    def escalate(request: ApprovalRequest, approver, comment: str = "") -> ApprovalAction:
        """
        Escalate to the next level without approval.
        """
        if request.status != ApprovalRequestStatus.PENDING:
            raise ValueError(f"Request is not pending (status={request.status})")

        max_level = request.chain.levels.order_by("-level").values_list("level", flat=True).first()
        if request.current_level >= max_level:
            raise ValueError("Cannot escalate beyond the highest level")

        action = ApprovalAction.objects.create(
            request=request,
            approver=approver,
            action_type=ApprovalActionType.ESCALATE,
            comment=comment,
            level=request.current_level,
        )

        request.current_level += 1
        request.status = ApprovalRequestStatus.ESCALATED
        request.save()

        # Reset to pending after recording escalation
        request.status = ApprovalRequestStatus.PENDING
        request.save()

        logger.info(f"Request {request.id} escalated from level {action.level} to {request.current_level}")

        return action

    @staticmethod
    def cancel(request: ApprovalRequest, user, comment: str = ""):
        """
        Cancel a pending request (only by submitter or admin).
        """
        if request.status != ApprovalRequestStatus.PENDING:
            raise ValueError(f"Request is not pending (status={request.status})")

        request.status = ApprovalRequestStatus.CANCELLED
        request.decision_comment = comment
        request.resolved_at = timezone.now()
        request.save()

        logger.info(f"Request {request.id} cancelled by {user}")

    @staticmethod
    def check_timeouts():
        """
        Check all pending requests for timeout conditions.
        Called by Celery task every 5 minutes.
        """
        pending_requests = ApprovalRequest.objects.filter(
            status=ApprovalRequestStatus.PENDING
        ).select_related("chain")

        for req in pending_requests:
            level = req.chain.levels.filter(level=req.current_level).first()
            if not level or not level.timeout_hours:
                continue

            # Find the last action at this level
            last_action = req.actions.filter(
                level=req.current_level
            ).order_by("-created_at").first()

            if not last_action:
                # No action yet — check from request submission
                reference_time = req.submitted_at
            else:
                reference_time = last_action.created_at

            elapsed = timezone.now() - reference_time
            if elapsed > timedelta(hours=level.timeout_hours):
                ApprovalEngine._handle_timeout(req, level)

    @staticmethod
    def _handle_timeout(request: ApprovalRequest, level: ApprovalLevel):
        """Handle timeout action for a level."""
        action = level.timeout_action

        if action == "auto_approve":
            # Find an admin or auto-approve
            from apps.users.models.users import UserModel
            admin_user = UserModel.objects.filter(is_superuser=True).first()
            if admin_user:
                ApprovalEngine.approve(request, admin_user, comment="Auto-approved due to timeout")
            else:
                logger.warning(f"Request {request.id}: No admin found for auto-approve on timeout")

        elif action == "auto_reject":
            from apps.users.models.users import UserModel
            admin_user = UserModel.objects.filter(is_superuser=True).first()
            if admin_user:
                ApprovalEngine.reject(request, admin_user, comment="Auto-rejected due to timeout")

        elif action == "escalate":
            from apps.users.models.users import UserModel
            admin_user = UserModel.objects.filter(is_superuser=True).first()
            if admin_user:
                try:
                    ApprovalEngine.escalate(request, admin_user, comment="Auto-escalated due to timeout")
                except ValueError:
                    # Already at highest level — auto-reject
                    ApprovalEngine.reject(request, admin_user, comment="Auto-rejected: timeout at highest level")

        logger.info(f"Request {request.id}: Timeout handled with action '{action}' at level {level.level}")
