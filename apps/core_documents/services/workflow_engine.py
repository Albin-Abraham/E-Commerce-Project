import logging

from django.core.exceptions import PermissionDenied, ValidationError
from django.db import transaction
from django.utils import timezone

from apps.core_documents.models.documents import Document
from apps.core_documents.models.workflows import ApprovalLevel, ApprovalWorkflow, ApprovalHistory

logger = logging.getLogger(__name__)


class DocumentWorkflowEngine:
    @classmethod
    @transaction.atomic
    def initialize_workflow(cls, document: Document, actor) -> ApprovalWorkflow | None:
        from apps.access_control.models import ApprovalChain

        doc_company = document.company
        chains_qs = ApprovalChain.objects.filter(
            approval_type=document.definition.key,
            is_active=True,
        )
        if doc_company:
            chains_qs = chains_qs.filter(company=doc_company)

        doc_metadata = document.metadata or {}
        dept_id = doc_metadata.get("department_id") or doc_metadata.get("department")
        desig_id = doc_metadata.get("designation_id") or doc_metadata.get("designation")

        best_chain = None
        best_score = -1

        for chain in chains_qs:
            conditions_match = True
            chain_conditions = chain.conditions or {}
            for cond_key, cond_val in chain_conditions.items():
                if cond_key.endswith("_gt"):
                    base_key = cond_key[:-3]
                    meta_val = doc_metadata.get(base_key)
                    try:
                        if meta_val is None or float(meta_val) <= float(cond_val):
                            conditions_match = False
                            break
                    except (ValueError, TypeError):
                        conditions_match = False
                        break
                elif cond_key.endswith("_lte"):
                    base_key = cond_key[:-4]
                    meta_val = doc_metadata.get(base_key)
                    try:
                        if meta_val is None or float(meta_val) > float(cond_val):
                            conditions_match = False
                            break
                    except (ValueError, TypeError):
                        conditions_match = False
                        break
                else:
                    if doc_metadata.get(cond_key) != cond_val:
                        conditions_match = False
                        break

            if not conditions_match:
                continue

            score = 0

            if chain.department_id:
                if (
                    str(chain.department_id) == str(dept_id)
                    or getattr(chain.department, "code", None) == str(dept_id)
                ):
                    score += 1000
                else:
                    continue

            if chain.designation_id:
                if (
                    str(chain.designation_id) == str(desig_id)
                    or getattr(chain.designation, "code", None) == str(desig_id)
                ):
                    score += 100
                else:
                    continue

            score += chain.priority

            if score > best_score:
                best_score = score
                best_chain = chain

        levels_to_create = []

        if best_chain:
            logger.info("Resolved dynamic ApprovalChain '%s' (Score: %d) for Document '%s'", best_chain.name, best_score, document.id)
            template_levels = best_chain.levels.all().order_by("level")
            for t_lvl in template_levels:
                level_num = t_lvl.level
                label = f"Level {level_num} Approval"
                if t_lvl.approver_by_type == "role" and t_lvl.approver:
                    label = f"{t_lvl.approver.name} Approval"
                elif t_lvl.approver_by_type == "specific_user" and t_lvl.approver:
                    label = f"{t_lvl.approver.username} Approval"

                req_perm = None
                if t_lvl.approver_by_type == "role" and t_lvl.approver:
                    role = t_lvl.approver
                    for key in getattr(role, "permission_keys", []):
                        if key.startswith("core_documents.approve"):
                            req_perm = key
                            break
                    if not req_perm:
                        role_slug = role.name.lower().replace(" ", "_")
                        req_perm = f"core_documents.approve_{role_slug}"
                elif t_lvl.approver_by_type == "specific_user" and t_lvl.approver:
                    user = t_lvl.approver
                    req_perm = f"core_documents.approve_user_{user.username.lower()}"
                else:
                    req_perm = f"core_documents.approve_lvl_{level_num}"

                levels_to_create.append({
                    "level": level_num,
                    "label": label,
                    "required_permission": req_perm,
                    "priority": getattr(t_lvl, "priority", 0),
                })
        else:
            config = document.definition.approval_chain_config
            if not config:
                return None
            for entry in config:
                level_num = entry.get("level")
                label = entry.get("label", f"Level {level_num} Approval")
                req_perm = entry.get("required_permission")
                if not level_num or not req_perm:
                    raise ValidationError(
                        "Invalid approval_chain_config entry. 'level' and 'required_permission' are required."
                    )
                levels_to_create.append({
                    "level": level_num,
                    "label": label,
                    "required_permission": req_perm,
                    "priority": entry.get("priority", 0),
                })

        ApprovalWorkflow.objects.filter(
            document=document,
            status=ApprovalWorkflow.WorkflowStatus.PENDING
        ).update(status=ApprovalWorkflow.WorkflowStatus.REJECTED)

        workflow = ApprovalWorkflow.objects.create(
            document=document,
            status=ApprovalWorkflow.WorkflowStatus.PENDING,
            current_level=1,
        )

        for lvl_data in levels_to_create:
            ApprovalLevel.objects.create(
                workflow=workflow,
                level_number=lvl_data["level"],
                label=lvl_data["label"],
                required_permission=lvl_data["required_permission"],
                status=ApprovalLevel.LevelStatus.PENDING,
                priority=lvl_data.get("priority", 0),
            )

        document.status = Document.DocumentStatus.UNDER_REVIEW
        document.status_changed_at = timezone.now()
        document.status_changed_by = actor
        document.save()

        logger.info(
            "Initialized approval workflow with %d levels for Document '%s' (ID: %s)",
            len(levels_to_create),
            document.definition.label,
            document.id,
        )
        return workflow

    @classmethod
    @transaction.atomic
    def approve_current_level(cls, document: Document, actor, comments=None) -> ApprovalWorkflow:
        if not actor.is_superuser:
            doc_company = document.company
            if doc_company:
                actor_profile = getattr(actor, "profile", None)
                if not actor_profile:
                    raise PermissionDenied("Access Denied: Actor profile context is required for company-scoped documents.")
                actor_company = getattr(actor_profile, "company", None)
                if not actor_company or doc_company != actor_company:
                    raise PermissionDenied("Access Denied: Actor company context does not match document company.")

        try:
            workflow = ApprovalWorkflow.objects.get(
                document=document, status=ApprovalWorkflow.WorkflowStatus.PENDING
            )
        except ApprovalWorkflow.DoesNotExist as err:
            raise ValidationError("No active pending workflow found for this document.") from err

        from apps.access_control.models import ApprovalChain
        chain = ApprovalChain.objects.filter(
            approval_type=document.definition.key,
            is_active=True,
        )
        if document.company:
            chain = chain.filter(company=document.company)
        chain_obj = chain.first()
        if chain_obj:
            allow_override = getattr(chain_obj, "allow_higher_level_override", True)
        else:
            allow_override = False

        if allow_override:
            pending_levels = ApprovalLevel.objects.filter(
                workflow=workflow,
                level_number__gte=workflow.current_level,
                status=ApprovalLevel.LevelStatus.PENDING,
            ).order_by("-level_number", "-priority", "id")
        else:
            pending_levels = ApprovalLevel.objects.filter(
                workflow=workflow,
                level_number=workflow.current_level,
                status=ApprovalLevel.LevelStatus.PENDING,
            ).order_by("-priority", "id")

        if not pending_levels.exists():
            raise ValidationError("No pending approval levels found.")

        current_level = None
        for level in pending_levels:
            if actor.is_superuser or actor.has_perm(level.required_permission):
                current_level = level
                break

        if not current_level:
            req_perms = [lvl.required_permission for lvl in pending_levels]
            raise PermissionDenied(
                f"User '{actor}' lacks the required permissions ({', '.join(req_perms)}) "
                f"required to approve any pending level."
            )

        if current_level.level_number > workflow.current_level:
            lower_pending_levels = ApprovalLevel.objects.filter(
                workflow=workflow,
                level_number__lt=current_level.level_number,
                status=ApprovalLevel.LevelStatus.PENDING,
            )
            for lvl in lower_pending_levels:
                lvl.status = ApprovalLevel.LevelStatus.APPROVED
                lvl.actioned_by = actor
                lvl.actioned_at = timezone.now()
                lvl.comments = f"Skipped by higher-level override (Level {current_level.level_number})"
                lvl.save()

                ApprovalHistory.objects.create(
                    workflow=workflow,
                    level_number=lvl.level_number,
                    label=lvl.label,
                    actor=actor,
                    action="APPROVED",
                    comments=f"Skipped by higher-level override (Level {current_level.level_number})",
                    policy_snapshot={
                        "expires": document.definition.expires,
                        "max_file_size": document.definition.max_file_size,
                        "allowed_extensions": document.definition.allowed_extensions,
                        "allowed_mime_types": document.definition.allowed_mime_types,
                    }
                )

        current_level.status = ApprovalLevel.LevelStatus.APPROVED
        current_level.actioned_by = actor
        current_level.actioned_at = timezone.now()
        current_level.comments = comments
        current_level.save()

        ApprovalHistory.objects.create(
            workflow=workflow,
            level_number=current_level.level_number,
            label=current_level.label,
            actor=actor,
            action="APPROVED",
            comments=comments,
            policy_snapshot={
                "expires": document.definition.expires,
                "max_file_size": document.definition.max_file_size,
                "allowed_extensions": document.definition.allowed_extensions,
                "allowed_mime_types": document.definition.allowed_mime_types,
            }
        )

        metadata = document.metadata or {}

        approved_before = metadata.setdefault("approved_before", [])
        approved_before.append({
            "user_id": str(actor.id),
            "email": actor.email,
            "level": current_level.level_number,
            "label": current_level.label,
            "actioned_at": timezone.now().isoformat(),
            "comments": comments,
        })

        dating_procedure = metadata.setdefault("dating_procedure", {})
        dating_procedure[f"level_{current_level.level_number}_{current_level.id}"] = {
            "label": current_level.label,
            "status": "APPROVED",
            "timestamp": timezone.now().isoformat(),
            "actioned_by": actor.username,
        }

        metadata["policy_rules"] = {
            "expires": document.definition.expires,
            "max_file_size": document.definition.max_file_size,
            "allowed_extensions": document.definition.allowed_extensions,
            "allowed_mime_types": document.definition.allowed_mime_types,
        }

        document.metadata = metadata
        document.save()

        pending_current_levels = ApprovalLevel.objects.filter(
            workflow=workflow,
            level_number=current_level.level_number,
            status=ApprovalLevel.LevelStatus.PENDING,
        )

        if not pending_current_levels.exists():
            next_level = ApprovalLevel.objects.filter(
                workflow=workflow,
                level_number__gt=current_level.level_number,
                status=ApprovalLevel.LevelStatus.PENDING,
            ).order_by("level_number").first()

            if next_level:
                workflow.current_level = next_level.level_number
                workflow.save()
                logger.info(
                    "Document '%s' step %d completed. Advancing to step %d.",
                    document.definition.label,
                    current_level.level_number,
                    workflow.current_level,
                )
            else:
                workflow.status = ApprovalWorkflow.WorkflowStatus.APPROVED
                workflow.save()

                document.status = Document.DocumentStatus.APPROVED
                document.status_changed_at = timezone.now()
                document.status_changed_by = actor
                document.rejection_reason = None
                document.save()

                logger.info(
                    "Document '%s' successfully passed all approval levels. State set to APPROVED.",
                    document.definition.label,
                )

        return workflow

    @classmethod
    @transaction.atomic
    def reject_current_level(cls, document: Document, actor, reason: str) -> ApprovalWorkflow:
        if not reason:
            raise ValidationError("A rejection reason must be provided.")

        if not actor.is_superuser:
            doc_company = document.company
            if doc_company:
                actor_profile = getattr(actor, "profile", None)
                if not actor_profile:
                    raise PermissionDenied("Access Denied: Actor profile context is required for company-scoped documents.")
                actor_company = getattr(actor_profile, "company", None)
                if not actor_company or doc_company != actor_company:
                    raise PermissionDenied("Access Denied: Actor company context does not match document company.")

        try:
            workflow = ApprovalWorkflow.objects.get(
                document=document, status=ApprovalWorkflow.WorkflowStatus.PENDING
            )
        except ApprovalWorkflow.DoesNotExist as err:
            raise ValidationError("No active pending workflow found for this document.") from err

        from apps.access_control.models import ApprovalChain
        chain = ApprovalChain.objects.filter(
            approval_type=document.definition.key,
            is_active=True,
        )
        if document.company:
            chain = chain.filter(company=document.company)
        chain_obj = chain.first()
        if chain_obj:
            allow_override = getattr(chain_obj, "allow_higher_level_override", True)
        else:
            allow_override = False

        if allow_override:
            pending_levels = ApprovalLevel.objects.filter(
                workflow=workflow,
                level_number__gte=workflow.current_level,
                status=ApprovalLevel.LevelStatus.PENDING,
            ).order_by("-level_number", "-priority", "id")
        else:
            pending_levels = ApprovalLevel.objects.filter(
                workflow=workflow,
                level_number=workflow.current_level,
                status=ApprovalLevel.LevelStatus.PENDING,
            ).order_by("-priority", "id")

        if not pending_levels.exists():
            raise ValidationError("No pending approval levels found.")

        current_level = None
        for level in pending_levels:
            if actor.is_superuser or actor.has_perm(level.required_permission):
                current_level = level
                break

        if not current_level:
            req_perms = [lvl.required_permission for lvl in pending_levels]
            raise PermissionDenied(
                f"User '{actor}' lacks the required permissions ({', '.join(req_perms)}) "
                f"required to reject any pending level."
            )

        current_level.status = ApprovalLevel.LevelStatus.REJECTED
        current_level.actioned_by = actor
        current_level.actioned_at = timezone.now()
        current_level.comments = reason
        current_level.save()

        ApprovalHistory.objects.create(
            workflow=workflow,
            level_number=current_level.level_number,
            label=current_level.label,
            actor=actor,
            action="REJECTED",
            comments=reason,
            policy_snapshot={
                "expires": document.definition.expires,
                "max_file_size": document.definition.max_file_size,
                "allowed_extensions": document.definition.allowed_extensions,
                "allowed_mime_types": document.definition.allowed_mime_types,
            }
        )

        metadata = document.metadata or {}

        approved_before = metadata.setdefault("approved_before", [])
        approved_before.append({
            "user_id": str(actor.id),
            "email": actor.email,
            "level": current_level.level_number,
            "label": current_level.label,
            "actioned_at": timezone.now().isoformat(),
            "comments": reason,
            "rejected": True,
        })

        dating_procedure = metadata.setdefault("dating_procedure", {})
        dating_procedure[f"level_{current_level.level_number}_{current_level.id}"] = {
            "label": current_level.label,
            "status": "REJECTED",
            "timestamp": timezone.now().isoformat(),
            "actioned_by": actor.username,
            "reason": reason,
        }

        metadata["policy_rules"] = {
            "expires": document.definition.expires,
            "max_file_size": document.definition.max_file_size,
            "allowed_extensions": document.definition.allowed_extensions,
            "allowed_mime_types": document.definition.allowed_mime_types,
        }

        document.metadata = metadata

        workflow.status = ApprovalWorkflow.WorkflowStatus.REJECTED
        workflow.save()

        document.status = Document.DocumentStatus.REJECTED
        document.status_changed_at = timezone.now()
        document.status_changed_by = actor
        document.rejection_reason = f"Rejected at Level {current_level.level_number}: {reason}"
        document.save()

        logger.warning(
            "Document '%s' rejected at Level %d by %s. Reason: %s",
            document.definition.label,
            current_level.level_number,
            actor,
            reason,
        )
        return workflow
