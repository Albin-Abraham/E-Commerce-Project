from django.db import models
from core.base_models.validator_model import BaseModel
from core.base_models.validators.rules import RequiredRule, UniqueRule
from core.base_models.fields import CustomCharField, RulesForeignKey

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
        rules=[
            RequiredRule("key"),
            UniqueRule("key", extra_filters={"company": "company"})
        ]
    )
    label = CustomCharField(rules=[RequiredRule("label")])
    prefix = CustomCharField(max_length=10, blank=True)
    description = models.TextField(blank=True)
    is_global = models.BooleanField(default=False)
    required = models.BooleanField(default=False)
    expires = models.BooleanField(default=False)
    metadata_schema = models.JSONField(default=dict, blank=True)
    is_active = models.BooleanField(default=True)

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
