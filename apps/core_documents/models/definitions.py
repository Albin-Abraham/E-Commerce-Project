from django.db import models

from core.base_models.fields import CustomCharField, RulesForeignKey
from core.base_models.validator_model import BaseModel
from core.base_models.validators.rules import RequiredRule, UniqueRule


class DocumentDefinition(BaseModel):
    """
    Blueprint for all documents in the system.
    Can be scoped to a specific Company or be Global.
    """

    company = RulesForeignKey(
        "core_admin.Company",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="document_definitions",
    )
    key = CustomCharField(
        max_length=50,
        rules=[RequiredRule("key"), UniqueRule("key", extra_filters={"company": "company"})],
    )
    label = CustomCharField(rules=[RequiredRule("label")])
    prefix = CustomCharField(max_length=10, blank=True)
    description = models.TextField(blank=True)
    is_global = models.BooleanField(default=False)
    required = models.BooleanField(default=False)
    expires = models.BooleanField(default=False)
    metadata_schema = models.JSONField(default=dict, blank=True)
    is_active = models.BooleanField(default=True)
    max_file_size = models.PositiveIntegerField(
        null=True, blank=True, help_text="Maximum allowed file size in bytes"
    )
    allowed_mime_types = models.JSONField(
        default=list, blank=True, help_text="List of allowed MIME types, e.g. ['application/pdf']"
    )
    allowed_extensions = models.JSONField(
        default=list, blank=True, help_text="List of allowed file extensions, e.g. ['.pdf']"
    )
    expiry_notification_days = models.PositiveIntegerField(
        default=30, help_text="Number of days before expiry to send an alert"
    )
    approval_chain_config = models.JSONField(
        default=list,
        blank=True,
        help_text="Configured approval levels for documents of this type"
    )

    class Meta:
        db_table = "core_documents_definitions"
        verbose_name = "Document Definition"
        verbose_name_plural = "Document Definitions"
        constraints = [
            models.UniqueConstraint(fields=["key", "company"], name="unique_key_per_company_v2"),
        ]

    def __str__(self):
        scope = "Global" if self.is_global else (self.company.name if self.company else "System")
        return f"{self.label} ({scope})"
