from django.db import models
from core.base_models.validator_model import BaseModel
from core.base_models.fields.short_ui_fields import CustomShortUUIDField
from core.base_models.fields.party_mixin import PartyReferenceMixin
from shared_domain.base.valuesets import ValueSet, ValueSetItem

VOUCHER_TYPE_VALUESET = ValueSet(
    name="VOUCHER_TYPE",
    domain="customers",
    description="Types of financial vouchers posting to Party Ledger",
    items=[
        ValueSetItem(code="SALES_INVOICE", label="Sales Invoice", is_active=True),
        ValueSetItem(code="PURCHASE_INVOICE", label="Purchase Invoice", is_active=True),
        ValueSetItem(code="PAYMENT_ENTRY", label="Payment Entry", is_active=True),
        ValueSetItem(code="JOURNAL_ENTRY", label="Journal Entry", is_active=True),
    ],
)



class PartyLedgerEntry(BaseModel, PartyReferenceMixin):
    """
    Unified Party Ledger Entry tracking debits, credits, open balances,
    and aging reports for all Party Types (Customers, Vendors, Partners).
    Aligned with yafei-hospital architecture.
    """

    id = CustomShortUUIDField(primary_key=True, prefix="ple_")
    company = models.ForeignKey(
        "core_admin.Company",
        on_delete=models.CASCADE,
        related_name="party_ledger_entries",
    )
    branch = models.ForeignKey(
        "core_admin.Branch",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="party_ledger_entries",
    )
    voucher_type = models.CharField(
        max_length=50,
        choices=VOUCHER_TYPE_VALUESET.as_django_choices(),
        default="SALES_INVOICE",
    )
    voucher_id = models.CharField(max_length=50, help_text="ID of source invoice or payment entry")
    voucher_no = models.CharField(max_length=100, help_text="Human-readable code e.g. INV-2026-0001")
    posting_date = models.DateField(db_index=True)
    due_date = models.DateField(null=True, blank=True)
    currency = models.CharField(max_length=5, default="USD")
    debit = models.DecimalField(max_digits=18, decimal_places=2, default=0.0)
    credit = models.DecimalField(max_digits=18, decimal_places=2, default=0.0)
    invoice_amount = models.DecimalField(max_digits=18, decimal_places=2, default=0.0)
    paid_amount = models.DecimalField(max_digits=18, decimal_places=2, default=0.0)
    is_reconciled = models.BooleanField(default=False)

    class Meta(BaseModel.Meta):
        db_table = "party_ledger_entries"
        ordering = ["posting_date", "created_at"]
        verbose_name = "Party Ledger Entry"
        verbose_name_plural = "Party Ledger Entries"
        indexes = [
            models.Index(fields=["company", "posting_date"]),
            models.Index(fields=["party_type", "party_id"]),
        ]

    def __str__(self):
        return f"LedgerEntry #{self.voucher_no} ({self.party_type} {self.party_id}): Dr {self.debit} / Cr {self.credit}"
