from django.db import models
from core.base_models.validator_model import BaseModel
from core.base_models.fields.short_ui_fields import CustomShortUUIDField
from core.base_models.fields.char_fields import CustomCharField
from core.base_models.validators.rules import RequiredRule, UniqueRule
from apps.accounting.valuesets import (
    ACCOUNT_ROOT_TYPE_VALUESET,
    ACCOUNT_TYPE_VALUESET,
)


class Account(BaseModel):
    """
    Chart of Accounts (CoA) supporting hierarchical parent-child accounts,
    multi-company scoping, and root classification (Asset, Liability, Equity, Income, Expense).
    """

    id = CustomShortUUIDField(primary_key=True, prefix="acc_")
    account_code = CustomCharField(
        max_length=50,
        rules=[RequiredRule("account_code"), UniqueRule("account_code")],
        help_text="Unique account code e.g. 1000-CASH, 1200-AR",
    )
    account_name = CustomCharField(
        max_length=200,
        rules=[RequiredRule("account_name")],
        help_text="Display name of the account",
    )
    company = models.ForeignKey(
        "core_admin.Company",
        on_delete=models.CASCADE,
        related_name="chart_of_accounts",
    )
    root_type = models.CharField(
        max_length=30,
        choices=ACCOUNT_ROOT_TYPE_VALUESET.as_django_choices(),
        default="ASSET",
    )
    account_type = models.CharField(
        max_length=50,
        choices=ACCOUNT_TYPE_VALUESET.as_django_choices(),
        blank=True,
        null=True,
    )
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="children",
        help_text="Parent account for hierarchical grouping",
    )
    currency = models.CharField(max_length=5, default="USD")
    is_group = models.BooleanField(
        default=False,
        help_text="Group accounts hold sub-accounts and cannot receive direct GL postings",
    )
    is_active = models.BooleanField(default=True)

    class Meta(BaseModel.Meta):
        db_table = "accounting_accounts"
        ordering = ["account_code"]
        verbose_name = "Account"
        verbose_name_plural = "Chart of Accounts"
        unique_together = [("company", "account_code")]

    def __str__(self):
        return f"{self.account_code} - {self.account_name}"
