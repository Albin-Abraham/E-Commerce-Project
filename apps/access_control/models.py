from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.utils.translation import gettext_lazy as _

from core.base_models.constants import USER_MODEL
from core.base_models.fields.short_ui_fields import CustomShortUUIDField
from core.base_models.scoping_models import BranchModelMixin
from core.base_models.validator_model import BaseModel


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
        auto=True,
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
        help_text="Optional: Elevate or restrict permissions within this specific entity scope.",
    )

    is_active = models.BooleanField(default=True)

    class Meta:  # type: ignore
        db_table = "master_access_control"
        verbose_name = "Master Access Control"
        verbose_name_plural = "Master Access Controls"
        indexes = [
            models.Index(fields=["content_type", "object_id"]),
            models.Index(fields=["user", "content_type", "object_id"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "content_type", "object_id"], name="unique_user_entity_access"
            )
        ]

    def __str__(self):
        return f"{self.user} -> {self.content_type.name} ({self.object_id})"


class FieldAccessControl(BaseModel):
    """
    Column-Level Security Engine.
    Allows configuring read/write restrictions on specific fields/columns dynamically.
    Can be applied globally (via Role) or specifically (via User).
    """

    id = CustomShortUUIDField(
        prefix="",
        month=False,
        day=False,
        year=False,
        unique=True,
        primary_key=True,
        editable=False,
        auto=True,
    )

    # 1. Who is restricted? (Can be a User or a Role)
    user = models.ForeignKey(
        USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="field_restrictions",
    )
    role = models.ForeignKey(
        "users.RolePermissions",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="field_restrictions",
    )

    # 2. What are they restricted from?
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    field_name = models.CharField(
        max_length=100, help_text="The exact name of the column/field to restrict."
    )

    # 3. What kind of restriction?
    can_read = models.BooleanField(
        default=True, help_text="If false, the field is stripped from all API responses."
    )
    can_write = models.BooleanField(
        default=False, help_text="If false, the field is marked read-only on all forms."
    )

    is_active = models.BooleanField(default=True)

    class Meta:  # type: ignore
        db_table = "field_access_control"
        verbose_name = "Field Access Control"
        verbose_name_plural = "Field Access Controls"
        indexes = [
            models.Index(fields=["content_type", "field_name"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "content_type", "field_name"],
                name="unique_user_field_access",
                condition=models.Q(user__isnull=False),
            ),
            models.UniqueConstraint(
                fields=["role", "content_type", "field_name"],
                name="unique_role_field_access",
                condition=models.Q(role__isnull=False),
            ),
        ]

    def __str__(self):
        target = self.user or self.role
        return f"{target} -> {self.content_type.name}.{self.field_name} (R:{self.can_read}, W:{self.can_write})"


class PolicyEffect(models.TextChoices):
    ALLOW = "allow", _("Allow")
    DENY = "deny", _("Deny")


class FieldAccessPolicy(BaseModel):
    """
    Logical container model for a Column-Level Security (CLS) Policy.
    Links to configurations and an optional approval workflow chain for changes.
    """

    id = CustomShortUUIDField(
        prefix="",
        month=False,
        day=False,
        year=False,
        unique=True,
        primary_key=True,
        editable=False,
        auto=True,
    )
    name = models.CharField(
        max_length=150, unique=True, default="", help_text="Unique name of the policy."
    )
    description = models.TextField(blank=True)

    # Target Resource (What resource is being restricted)
    content_type = models.ForeignKey(
        ContentType, on_delete=models.CASCADE, related_name="target_policies"
    )
    field_name = models.CharField(
        max_length=100, help_text="The exact name of the column/field to restrict."
    )

    # Workflow integration using the Approval Engine
    approval_chain = models.ForeignKey(
        "access_control.ApprovalChain",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="Optional approval workflow to govern policy configuration changes.",
    )

    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "field_access_policies"
        verbose_name = "Field Access Policy"
        verbose_name_plural = "Field Access Policies"

    def __str__(self):
        return f"{self.name} ({self.content_type.model}.{self.field_name})"


class PolicyConfigurationStatus(models.TextChoices):
    DRAFT = "draft", _("Draft")
    PENDING_APPROVAL = "pending_approval", _("Pending Approval")
    ACTIVE = "active", _("Active")
    ARCHIVED = "archived", _("Archived")


class PolicyConfiguration(BaseModel):
    """
    Separate configuration model representing a specific version of a Policy.
    Tracks draft, pending approval, and active states.
    """

    id = CustomShortUUIDField(
        prefix="",
        month=False,
        day=False,
        year=False,
        unique=True,
        primary_key=True,
        editable=False,
        auto=True,
    )
    policy = models.ForeignKey(
        FieldAccessPolicy, on_delete=models.CASCADE, related_name="configurations"
    )
    version = models.PositiveIntegerField(default=1)

    # Subject (Who the rule applies to) - Generic GFK
    subject_type = models.ForeignKey(
        ContentType, on_delete=models.CASCADE, related_name="config_subjects"
    )
    subject_id = models.CharField(max_length=50)
    subject = GenericForeignKey("subject_type", "subject_id")

    # Policy Action and Effect (Extensible)
    action = models.CharField(
        max_length=50, default="read", help_text="Action to control: 'read', 'write', 'mask', etc."
    )
    effect = models.CharField(
        max_length=20,
        choices=PolicyEffect.choices,
        default=PolicyEffect.DENY,
        help_text="Effect of the policy: 'allow' or 'deny'.",
    )

    # Contextual Scoping (Generic GFK)
    scope_type = models.ForeignKey(
        ContentType, on_delete=models.CASCADE, null=True, blank=True, related_name="config_scopes"
    )
    scope_id = models.CharField(max_length=50, null=True, blank=True)
    scope = GenericForeignKey("scope_type", "scope_id")

    # Conditional logic
    conditions = models.JSONField(
        default=dict,
        blank=True,
        help_text="JSON-based conditional rules for dynamic policy matching.",
    )

    status = models.CharField(
        max_length=20,
        choices=PolicyConfigurationStatus.choices,
        default=PolicyConfigurationStatus.DRAFT,
    )

    class Meta:
        db_table = "policy_configurations"
        verbose_name = "Policy Configuration"
        verbose_name_plural = "Policy Configurations"
        constraints = [
            models.UniqueConstraint(fields=["policy", "version"], name="unique_policy_version")
        ]

    def __str__(self):
        return f"{self.policy.name} - v{self.version} ({self.status})"

    def _override_pre_save(self, is_creating: bool):
        # Auto-calculate checksum and create snapshot on activation
        is_activation = False
        if not is_creating and self.pk:
            orig = PolicyConfiguration.objects.get(pk=self.pk)
            if orig.status != self.status and self.status == PolicyConfigurationStatus.ACTIVE:
                is_activation = True
        elif self.status == PolicyConfigurationStatus.ACTIVE:
            is_activation = True

        if is_activation:
            # archive other configurations
            PolicyConfiguration.objects.filter(
                policy=self.policy, status=PolicyConfigurationStatus.ACTIVE
            ).update(status=PolicyConfigurationStatus.ARCHIVED)
            # Store activation trigger for post_save
            self._trigger_snapshot = True

    def _override_post_save(self, is_creating: bool):
        if getattr(self, "_trigger_snapshot", False):
            import hashlib
            import json

            # Create snapshot ledger entry
            snapshot_dict = {
                "policy_id": str(self.policy_id),
                "version": self.version,
                "subject_type_id": self.subject_type_id,
                "subject_id": self.subject_id,
                "action": self.action,
                "effect": self.effect,
                "scope_type_id": self.scope_type_id,
                "scope_id": self.scope_id,
                "conditions": self.conditions,
            }
            dumped = json.dumps(snapshot_dict, sort_keys=True)
            checksum = hashlib.sha256(dumped.encode("utf-8")).hexdigest()
            PolicySnapshot.objects.create(
                policy=self.policy,
                version=self.version,
                snapshot_data=snapshot_dict,
                checksum=checksum,
            )


class PolicySnapshot(BaseModel):
    """
    Immutable snapshot ledger of field access policies.
    """

    id = CustomShortUUIDField(
        prefix="",
        month=False,
        day=False,
        year=False,
        unique=True,
        primary_key=True,
        editable=False,
        auto=True,
    )
    policy = models.ForeignKey(
        FieldAccessPolicy, on_delete=models.CASCADE, related_name="snapshots"
    )
    version = models.PositiveIntegerField()
    snapshot_data = models.JSONField()
    checksum = models.CharField(max_length=64)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "policy_snapshots"
        ordering = ["-version"]
        verbose_name = "Policy Snapshot"
        verbose_name_plural = "Policy Snapshots"

    def __str__(self):
        return f"Snapshot {self.policy.name} - v{self.version}"


class Department(BaseModel, BranchModelMixin):
    """
    Department model to group users/roles and scope approval chains.
    """
    id = CustomShortUUIDField(
        prefix="",
        month=False,
        day=False,
        year=False,
        unique=True,
        primary_key=True,
        editable=False,
        auto=True,
    )
    name = models.CharField(
        max_length=150,
        verbose_name=_("Name"),
        help_text=_("Department name (e.g. HR, Finance, Cardiology)."),
    )
    code = models.CharField(
        max_length=50,
        unique=True,
        verbose_name=_("Code"),
        help_text=_("Unique code for department (e.g. HR, CARD, ENG)."),
    )
    description = models.TextField(
        blank=True,
        null=True,
        help_text=_("Optional description or notes about the department."),
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name=_("Active"),
    )

    class Meta:
        db_table = "access_control_departments"
        verbose_name = _("Department")
        verbose_name_plural = _("Departments")
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.code})"


class Designation(BaseModel, BranchModelMixin):
    """
    Designation model for roles/titles in the organization.
    """
    id = CustomShortUUIDField(
        prefix="",
        month=False,
        day=False,
        year=False,
        unique=True,
        primary_key=True,
        editable=False,
        auto=True,
    )
    name = models.CharField(
        max_length=150,
        verbose_name=_("Name"),
        help_text=_("Designation name (e.g. Lead Engineer, Product Manager)."),
    )
    code = models.CharField(
        max_length=50,
        unique=True,
        verbose_name=_("Code"),
        help_text=_("Unique code for designation (e.g. LE, PM)."),
    )
    description = models.TextField(
        blank=True,
        null=True,
        help_text=_("Optional description or notes about the designation."),
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name=_("Active"),
    )

    class Meta:
        db_table = "access_control_designations"
        verbose_name = _("Designation")
        verbose_name_plural = _("Designations")
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.code})"


class AutoSetActionChoices(models.TextChoices):
    NULL = "null", _("Level Based")
    APPROVE = "approve", _("Auto Approve")
    REJECT = "reject", _("Auto Reject")


class ApprovalChain(BaseModel, BranchModelMixin):
    """
    Industrialized Approval Workflow Template.
    A chain is selected based on:
    - approval_type (e.g., "purchase_order", "leave_request")
    - designation / department
    - domain_entity (GenericForeignKey to Department, Project, etc.)
    - priority (higher first)
    """

    name = models.CharField(
        max_length=100,
        verbose_name=_("Name"),
        help_text=_("Friendly name (e.g. IT Department Leave Approval)."),
    )

    designation = models.ForeignKey(
        Designation,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approval_chains",
        verbose_name=_("Designation"),
    )

    department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approval_chains",
        verbose_name=_("Department"),
    )

    approval_type = models.CharField(
        max_length=100,
        verbose_name=_("Approval Type"),
        help_text=_("Identifier for the type of request (e.g. 'invoice', 'purchase_order')"),
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
        related_name="approval_chains",
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

    class Meta:  # type: ignore
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
    priority = models.PositiveIntegerField(
        default=0,
        verbose_name=_("Priority"),
        help_text=_("Priority ordering for parallel levels at the same sequence step."),
    )

    class Meta:  # type: ignore
        db_table = "approval_levels"
        verbose_name = _("Approval Level")
        verbose_name_plural = _("Approval Levels")
        ordering = ["level"]

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
