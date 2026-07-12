import uuid
from django.db import models
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from core.base_models.validator_model import BaseModel
from core.base_models.constants import USER_MODEL
from django.utils.translation import gettext_lazy as _
from core.base_models.scoping_models import BranchModelMixin
from core.base_models.fields.short_ui_fields import CustomShortUUIDField

class EntityAccessControl(BaseModel):
    """
    Master Access Control Table.
    Uses GenericForeignKey to grant a User access to ANY entity (Company, Branch, Document, Project, etc).
    Replaces brittle junction tables like UserCompanyAccess and UserBranchAccess.
    """
    id = CustomShortUUIDField(
        prefix="",
        month=False,
        day=False,
        year=False,
        unique=True,
        primary_key=True,
        editable=False,
        auto=True
    )
    user = models.ForeignKey(USER_MODEL, on_delete=models.CASCADE, related_name="acl_assignments")
    
    # The Entity being granted access to (e.g. Branch, Company)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.CharField(max_length=50) 
    content_object = GenericForeignKey("content_type", "object_id")
    
    # Optional RBAC mapping for this specific scope
    role = models.ForeignKey(
        "users.RolePermissions", 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        help_text="Optional: Elevate or restrict permissions within this specific entity scope."
    )

    is_active = models.BooleanField(default=True)

    class Meta: # type: ignore
        db_table = "master_access_control"
        verbose_name = "Master Access Control"
        verbose_name_plural = "Master Access Controls"
        indexes = [
            models.Index(fields=["content_type", "object_id"]),
            models.Index(fields=["user", "content_type", "object_id"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "content_type", "object_id"],
                name="unique_user_entity_access"
            )
        ]

    def __str__(self):
        return f"{self.user} -> {self.content_type.name} ({self.object_id})"


class AutoSetActionChoices(models.TextChoices):
    NULL = "null", _("Level Based")
    APPROVE = "approve", _("Auto Approve")
    REJECT = "reject", _("Auto Reject")


class ApprovalChain(BaseModel, BranchModelMixin):
    """
    Industrialized Approval Workflow Template.
    A chain is selected based on:
    - approval_type (e.g., "purchase_order", "leave_request")
    - domain_entity (GenericForeignKey to Department, Project, etc.)
    - priority (higher first)
    """

    permission_prefix = "access:approval_chain"
    permission_map = {
        "list": "view",
        "retrieve": "view",
        "create": "create",
        "update": "update",
        "partial_update": "update",
        "destroy": "delete",
    }

    name = models.CharField(
        max_length=100,
        verbose_name=_("Name"),
        help_text=_("Friendly name (e.g. IT Department Leave Approval)."),
    )

    approval_type = models.CharField(
        max_length=100,
        verbose_name=_("Approval Type"),
        help_text=_("Identifier for the type of request (e.g. 'invoice', 'purchase_order')")
    )

    conditions = models.JSONField(
        default=dict,
        blank=True,
        verbose_name=_("Conditions"),
        help_text=_("JSON-based matching rules (e.g. {'amount_gt': 5000})"),
    )

    priority = models.PositiveIntegerField(
        default=0,
        verbose_name=_("Priority"),
        help_text=_("Higher priority chains are evaluated first."),
    )

    allow_higher_level_override = models.BooleanField(
        default=True,
        verbose_name=_("Allow Higher-Level Override"),
        help_text=_("Allows senior approvers to approve requests pending at lower levels."),
    )

    # Generic binding to a specific Domain Entity (e.g., a specific Department, Project, or Role)
    domain_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        verbose_name=_("Domain Object Type"),
        related_name="approval_chains"
    )
    domain_id = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        verbose_name=_("Domain Object ID"),
    )
    domain_object = GenericForeignKey("domain_type", "domain_id")

    chain_auto_action = models.CharField(
        max_length=20,
        choices=AutoSetActionChoices.choices,
        default=AutoSetActionChoices.NULL,
        verbose_name=_("Chain Auto Action"),
    )

    is_active = models.BooleanField(
        default=True,
        verbose_name=_("Active"),
    )

    class Meta: # type: ignore
        db_table = "approval_chains"
        verbose_name = _("Approval Chain")
        verbose_name_plural = _("Approval Chains")
        ordering = ["-priority"]

    def __str__(self):
        return f"{self.name} ({self.approval_type})"


class ApprovalLevel(BaseModel, BranchModelMixin):
    """
    Represents a single approval step within an ApprovalChain.
    """

    permission_prefix = "access:approval_level"
    permission_map = {
        "list": "view",
        "retrieve": "view",
        "create": "create",
        "update": "update",
        "partial_update": "update",
        "destroy": "delete",
    }

    class ApprovalByChoices(models.TextChoices):
        SPECIFIC_USER = "specific_user", _("Specific User")
        ROLE = "role", _("Role")

    class ActionChoices(models.TextChoices):
        NONE = "none", _("Do Nothing")
        AUTO_APPROVE = "auto_approve", _("Auto Approve")
        AUTO_REJECT = "auto_reject", _("Auto Reject")
        ESCALATE = "escalate", _("Escalate to Next Level")

    chain = models.ForeignKey(
        ApprovalChain,
        on_delete=models.CASCADE,
        related_name="levels",
        verbose_name=_("Approval Chain"),
    )

    level = models.PositiveIntegerField(
        verbose_name=_("Level"),
        help_text=_("Approval level number (1, 2, 3...)."),
    )

    # ----------------------------------------------------
    # Primary Approver
    # ----------------------------------------------------
    approver_by_type = models.CharField(
        max_length=50,
        choices=ApprovalByChoices.choices,
        verbose_name=_("Approver By"),
    )
    approver_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="level_approvers",
    )
    approver_id = models.CharField(
        max_length=50,
        null=True,
        blank=True,
    )
    approver = GenericForeignKey("approver_type", "approver_id")

    # ----------------------------------------------------
    # Fallback Approver
    # ----------------------------------------------------
    fallback_approver_by_type = models.CharField(
        max_length=50,
        choices=ApprovalByChoices.choices,
        verbose_name=_("Fallback Approver By"),
    )
    fallback_approver_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="level_fallback_approvers",
    )
    fallback_approver_id = models.CharField(
        max_length=50,
        null=True,
        blank=True,
    )
    fallback_approver = GenericForeignKey("fallback_approver_type", "fallback_approver_id")

    # ----------------------------------------------------
    # Level Rules
    # ----------------------------------------------------
    allow_direct_approval = models.BooleanField(
        default=False,
        verbose_name=_("Allow Direct Approval"),
        help_text=_("Allows finalizing the request instantly at this level."),
    )
    is_optional = models.BooleanField(
        default=False,
        verbose_name=_("Optional"),
    )
    timeout_hours = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name=_("Timeout (Hours)"),
    )
    timeout_action = models.CharField(
        max_length=20,
        choices=ActionChoices.choices,
        default=ActionChoices.NONE,
        verbose_name=_("Timeout Action"),
    )
    can_edit_request = models.BooleanField(
        default=False,
        verbose_name=_("Can Edit Request"),
    )

    class Meta: # type: ignore
        db_table = "approval_levels"
        verbose_name = _("Approval Level")
        verbose_name_plural = _("Approval Levels")
        ordering = ["level"]
        unique_together = (("chain", "level"),)

    def __str__(self):
        return f"{self.chain.name} - Level {self.level}"


class ApprovalRequestStatus(models.TextChoices):
    PENDING = "pending", _("Pending")
    APPROVED = "approved", _("Approved")
    REJECTED = "rejected", _("Rejected")
    CANCELLED = "cancelled", _("Cancelled")
    ESCALATED = "escalated", _("Escalated")


class ApprovalRequest(BaseModel, BranchModelMixin):
    """
    A submitted request awaiting approval through an ApprovalChain.
    Uses GenericForeignKey to bind to any model (purchase order, leave request, etc.).
    """

    permission_prefix = "access:approval_request"
    permission_map = {
        "list": "view",
        "retrieve": "view",
        "create": "submit",
        "update": "update",
        "partial_update": "update",
        "destroy": "cancel",
    }

    chain = models.ForeignKey(
        ApprovalChain,
        on_delete=models.CASCADE,
        related_name="requests",
        verbose_name=_("Approval Chain"),
    )

    submitter = models.ForeignKey(
        USER_MODEL,
        on_delete=models.CASCADE,
        related_name="submitted_approvals",
        verbose_name=_("Submitter"),
    )

    # GenericFK — what's being approved
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        verbose_name=_("Request Type"),
    )
    object_id = models.CharField(
        max_length=50,
        verbose_name=_("Request ID"),
    )
    content_object = GenericForeignKey("content_type", "object_id")

    status = models.CharField(
        max_length=20,
        choices=ApprovalRequestStatus.choices,
        default=ApprovalRequestStatus.PENDING,
        verbose_name=_("Status"),
    )

    current_level = models.PositiveIntegerField(
        default=1,
        verbose_name=_("Current Level"),
        help_text=_("Which approval level this request is currently at."),
    )

    payload = models.JSONField(
        default=dict,
        blank=True,
        verbose_name=_("Payload"),
        help_text=_("Snapshot of the request data at submission time."),
    )

    decision_comment = models.TextField(
        blank=True,
        verbose_name=_("Decision Comment"),
    )

    submitted_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_("Submitted At"),
    )

    resolved_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name=_("Resolved At"),
    )

    class Meta:  # type: ignore
        db_table = "approval_requests"
        verbose_name = _("Approval Request")
        verbose_name_plural = _("Approval Requests")
        ordering = ["-submitted_at"]
        indexes = [
            models.Index(fields=["status", "chain"]),
            models.Index(fields=["submitter", "status"]),
        ]

    def __str__(self):
        return f"Request {self.id} ({self.status}) via {self.chain.name}"


class ApprovalActionType(models.TextChoices):
    APPROVE = "approve", _("Approve")
    REJECT = "reject", _("Reject")
    ESCALATE = "escalate", _("Escalate")
    COMMENT = "comment", _("Comment")


class ApprovalAction(BaseModel):
    """
    An individual action taken on an ApprovalRequest (approve, reject, escalate, comment).
    """

    permission_prefix = "access:approval_action"
    permission_map = {
        "list": "view",
        "retrieve": "view",
        "create": "action",
    }

    request = models.ForeignKey(
        ApprovalRequest,
        on_delete=models.CASCADE,
        related_name="actions",
        verbose_name=_("Approval Request"),
    )

    approver = models.ForeignKey(
        USER_MODEL,
        on_delete=models.CASCADE,
        related_name="approval_actions",
        verbose_name=_("Approver"),
    )

    action_type = models.CharField(
        max_length=20,
        choices=ApprovalActionType.choices,
        verbose_name=_("Action Type"),
    )

    comment = models.TextField(
        blank=True,
        verbose_name=_("Comment"),
    )

    level = models.PositiveIntegerField(
        verbose_name=_("Level"),
        help_text=_("Which approval level this action was taken at."),
    )

    class Meta:  # type: ignore
        db_table = "approval_actions"
        verbose_name = _("Approval Action")
        verbose_name_plural = _("Approval Actions")
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.action_type} by {self.approver} on Request {self.request_id}"
