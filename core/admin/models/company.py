from django.db import models
from django.utils import timezone
from django.db import transaction
from django.core.exceptions import ValidationError
from core.admin.models.subscriptions import Subscription
from core.base_models.validators.rules import RequiredRule, MinRule, EmailRule, UniqueRule, RelationKeyRule
from core.base_models.fields import CustomCharField, CustomEmailField, RulesForeignKey, CustomShortUUIDField
from core.base_models.validator_model import BaseModel
from core.base_models.constants import (
    USER_MODEL,
    NAME_MAX_LENGTH,
)


# ===========================
# Company
# ===========================
class Company(BaseModel):
    """
    The top-level tenant entity.
    
    All system data (except global configuration) is partitioned by Company.
    Enforces business-level uniqueness for name and email via rule-based validation.
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
    name = CustomCharField(
        unique=True, 
        rules=[RequiredRule("name"), MinRule("name", 3), UniqueRule("name")]
    )
    email = CustomEmailField(
        unique=True,
        rules=[RequiredRule("email"), EmailRule("email"), UniqueRule("email")]
    )
    code = CustomCharField(
        max_length=20,
        unique=True,
        rules=[RequiredRule("code"), UniqueRule("code")]
    )
    subscription = models.ForeignKey(
        Subscription,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="companies",
    )
    default_currency = models.ForeignKey(
        "accounting.Currency",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="companies_using_base",
        help_text="Company base General Ledger reporting currency e.g. USD, SAR, EUR",
    )

    permission_prefix = "company"

    permission_map = {
        "list":            "view",
        "retrieve":        "view",
        "create":          "create",
        "update":          "edit",
        "partial_update":  "edit",
        "destroy":         "delete",
        "bulk_upload":     "import",
        "download_report": "export",
        "audit":           "audit",
        "manage":          "manage",
        "get_analytics":   "can_get_analytics",
        "manage_ledger":   "can_manage_ledger",
    }

    class Meta(BaseModel.Meta):
        db_table = "companies"
        ordering = ["name"]
        verbose_name = "Company"
        verbose_name_plural = "Companies"
        permissions = (
            ("company:view", "View Company"),
            ("company:create", "Create Company"),
            ("company:edit", "Edit Company"),
            ("company:delete", "Delete Company"),
            ("company:import", "Import Company Data"),
            ("company:export", "Export Company Data"),
            ("company:audit", "Audit Company Logs"),
            ("company:manage", "Manage Company"),
            ("company:can_get_analytics", "Get Company Analytics"),
            ("company:can_manage_ledger", "Manage Company Ledger"),
        )

    def __str__(self):
        return f"{self.name} ({self.code})"


class CompanyExtension(BaseModel):
    """
    EAV-like extension for Company-specific metadata and flags.
    """
    company = models.OneToOneField(
        Company,
        on_delete=models.CASCADE,
        related_name="extensions",
    )
    extra_documents = models.JSONField(default=list, blank=True)
    extra_attributes = models.JSONField(default=dict, blank=True)

    class Meta(BaseModel.Meta):
        db_table = "company_extensions"

    def __str__(self):
        return f"Extensions for {self.company.name}"
