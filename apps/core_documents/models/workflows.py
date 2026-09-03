from django.db import models
from core.base_models.constants import USER_MODEL
from core.base_models.validator_model import BaseModel


from apps.core_documents.valuesets import (
    APPROVAL_ACTION_VALUESET,
    LEVEL_STATUS_VALUESET,
    WORKFLOW_STATUS_VALUESET,
)


class ApprovalWorkflow(BaseModel):
    """
    Tracks the active approval process for a Document.
    """

    document = models.ForeignKey(
        "core_documents.Document",
        on_delete=models.CASCADE,
        related_name="workflows",
    )
    current_level = models.PositiveIntegerField(
        default=1,
        help_text="The current active level number in the chain",
    )
    status = models.CharField(
        max_length=20,
        choices=WORKFLOW_STATUS_VALUESET.as_django_choices(),
        default="PENDING",
        help_text="The overall status of this approval workflow",
    )

    class Meta:
        db_table = "document_approval_workflows"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Workflow for {self.document} (Level {self.current_level} - {self.status})"


class ApprovalLevel(BaseModel):
    """
    Represents a specific level of approval within a workflow.
    """

    workflow = models.ForeignKey(
        ApprovalWorkflow,
        on_delete=models.CASCADE,
        related_name="levels",
    )
    level_number = models.PositiveIntegerField(
        help_text="Sequence position of this approval level (1-indexed)",
    )
    label = models.CharField(
        max_length=100,
        help_text="Human-readable label for this level, e.g., 'Department Manager'",
    )
    required_permission = models.CharField(
        max_length=100,
        help_text="The permission code required by the actor to sign off this level",
    )
    status = models.CharField(
        max_length=20,
        choices=LEVEL_STATUS_VALUESET.as_django_choices(),
        default="PENDING",
        help_text="Sign-off status of this specific level",
    )
    actioned_by = models.ForeignKey(
        USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="actioned_levels",
        help_text="The user who approved or rejected this level",
    )
    actioned_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Timestamp when the action was performed",
    )
    comments = models.TextField(
        blank=True,
        null=True,
        help_text="Optional comments or rejection feedback from the sign-off actor",
    )
    priority = models.PositiveIntegerField(
        default=0,
        help_text="Priority ordering for parallel levels at the same sequence step.",
    )

    class Meta:
        db_table = "document_approval_levels"
        ordering = ["workflow", "level_number", "-priority", "id"]

    def __str__(self):
        return f"{self.workflow.document} Level {self.level_number}: {self.label} ({self.status})"


class ApprovalHistory(BaseModel):
    """
    Audit trail of actions taken during the document approval process.
    """
    workflow = models.ForeignKey(
        ApprovalWorkflow,
        on_delete=models.CASCADE,
        related_name="history",
        help_text="The associated workflow"
    )
    level_number = models.PositiveIntegerField(
        help_text="Sequence position of the approval level"
    )
    label = models.CharField(
        max_length=100,
        help_text="Label of the level, e.g. 'Department Manager'"
    )
    actor = models.ForeignKey(
        USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="approval_history_actions",
        help_text="The user who took the action"
    )
    action = models.CharField(
        max_length=20,
        choices=APPROVAL_ACTION_VALUESET.as_django_choices(),
        help_text="Action taken"
    )
    actioned_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Timestamp of the action"
    )
    comments = models.TextField(
        blank=True,
        null=True,
        help_text="Comments or rejection feedback"
    )
    policy_snapshot = models.JSONField(
        default=dict,
        blank=True,
        help_text="Snapshot of the policy/rules during this action"
    )

    class Meta:
        db_table = "document_approval_history"
        ordering = ["-actioned_at"]

    def __str__(self):
        return f"{self.workflow.document} - Level {self.level_number} - {self.action} by {self.actor}"
