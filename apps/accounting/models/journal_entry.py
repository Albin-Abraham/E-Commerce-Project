from django.db import models
from core.base_models.validator_model import BaseModel
from core.base_models.fields.short_ui_fields import CustomShortUUIDField
from core.base_models.fields.char_fields import CustomCharField
from core.base_models.fields.party_mixin import PartyReferenceMixin
from core.base_models.validators.rules import RequiredRule, UniqueRule
from apps.accounting.models.chart_of_accounts import Account
from apps.accounting.models.fiscal_year import CostCenter, FiscalYear
from apps.accounting.valuesets import JOURNAL_ENTRY_TYPE_VALUESET


class JournalEntry(BaseModel):
    """
    Accounting Journal Entry Voucher for manual or automated GL posting.
    """

    id = CustomShortUUIDField(primary_key=True, prefix="jv_")
    entry_number = CustomCharField(
        max_length=60,
        blank=True,
        default="",
        rules=[UniqueRule("entry_number")],
    )
    company = models.ForeignKey(
        "core_admin.Company",
        on_delete=models.CASCADE,
        related_name="journal_entries",
    )
    branch = models.ForeignKey(
        "core_admin.Branch",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="journal_entries",
    )
    entry_type = models.CharField(
        max_length=50,
        choices=JOURNAL_ENTRY_TYPE_VALUESET.as_django_choices(),
        default="JOURNAL_ENTRY",
    )
    posting_date = models.DateField()
    total_debit = models.DecimalField(max_digits=18, decimal_places=2, default=0.0)
    total_credit = models.DecimalField(max_digits=18, decimal_places=2, default=0.0)
    is_posted = models.BooleanField(default=False)
    user_remark = models.TextField(blank=True, null=True)

    class Meta(BaseModel.Meta):
        db_table = "accounting_journal_entries"
        ordering = ["-posting_date", "-created_at"]
        verbose_name = "Journal Entry"
        verbose_name_plural = "Journal Entries"

    def __str__(self):
        return f"JV #{self.entry_number} ({self.posting_date}) - Dr {self.total_debit} / Cr {self.total_credit}"


class JournalEntryLine(BaseModel, PartyReferenceMixin):
    """
    Individual debit/credit line in a Journal Entry.
    Includes polymorphic party reference for AR/AP tracking.
    """

    id = CustomShortUUIDField(primary_key=True, prefix="jvl_")
    journal_entry = models.ForeignKey(
        JournalEntry,
        on_delete=models.CASCADE,
        related_name="lines",
    )
    account = models.ForeignKey(
        Account,
        on_delete=models.PROTECT,
        related_name="journal_lines",
    )
    cost_center = models.ForeignKey(
        CostCenter,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="journal_lines",
    )
    debit = models.DecimalField(max_digits=18, decimal_places=2, default=0.0)
    credit = models.DecimalField(max_digits=18, decimal_places=2, default=0.0)
    user_remark = models.CharField(max_length=255, blank=True, null=True)

    class Meta(BaseModel.Meta):
        db_table = "accounting_journal_entry_lines"
        verbose_name = "Journal Entry Line"
        verbose_name_plural = "Journal Entry Lines"

    def __str__(self):
        return f"Line ({self.account.account_code}): Dr {self.debit} / Cr {self.credit}"


class GLEntry(BaseModel, PartyReferenceMixin):
    """
    General Ledger (GL) Entry - Immutable atomic ledger posting line.
    Generates trial balances, balance sheets, and profit & loss statements.
    """

    id = CustomShortUUIDField(primary_key=True, prefix="gle_")
    company = models.ForeignKey(
        "core_admin.Company",
        on_delete=models.CASCADE,
        related_name="gl_entries",
    )
    branch = models.ForeignKey(
        "core_admin.Branch",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="gl_entries",
    )
    account = models.ForeignKey(
        Account,
        on_delete=models.PROTECT,
        related_name="gl_entries",
    )
    cost_center = models.ForeignKey(
        CostCenter,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="gl_entries",
    )
    posting_date = models.DateField(db_index=True)
    voucher_type = models.CharField(max_length=50, db_index=True)
    voucher_no = models.CharField(max_length=100, db_index=True)
    voucher_id = models.CharField(max_length=50)
    debit = models.DecimalField(max_digits=18, decimal_places=2, default=0.0)
    credit = models.DecimalField(max_digits=18, decimal_places=2, default=0.0)
    currency = models.CharField(max_length=5, default="USD")
    is_cancelled = models.BooleanField(default=False)

    class Meta(BaseModel.Meta):
        db_table = "accounting_gl_entries"
        ordering = ["posting_date", "created_at"]
        verbose_name = "GL Entry"
        verbose_name_plural = "GL Entries"
        indexes = [
            models.Index(fields=["company", "posting_date"]),
            models.Index(fields=["account", "posting_date"]),
            models.Index(fields=["voucher_type", "voucher_no"]),
            models.Index(fields=["party_type", "party_id"]),
        ]

    def __str__(self):
        return f"GL Entry ({self.account.account_code}) {self.voucher_no}: Dr {self.debit} / Cr {self.credit}"
