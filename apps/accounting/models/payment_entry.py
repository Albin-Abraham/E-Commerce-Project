from django.db import models
from core.base_models.validator_model import BaseModel
from core.base_models.fields.short_ui_fields import CustomShortUUIDField
from core.base_models.fields.char_fields import CustomCharField
from core.base_models.fields.party_mixin import PartyReferenceMixin
from core.base_models.validators.rules import RequiredRule, UniqueRule
from apps.accounting.models.chart_of_accounts import Account
from apps.accounting.valuesets import PAYMENT_TYPE_VALUESET


class PaymentEntry(BaseModel, PartyReferenceMixin):
    """
    Payment Entry for Customer Receipts, Vendor Payments, and Bank/Cash Transfers.
    Includes allocation references to open Sales/Purchase Invoices.
    """

    id = CustomShortUUIDField(primary_key=True, prefix="pe_")
    payment_number = CustomCharField(
        max_length=60,
        blank=True,
        default="",
        rules=[UniqueRule("payment_number")],
    )
    company = models.ForeignKey(
        "core_admin.Company",
        on_delete=models.CASCADE,
        related_name="payment_entries",
    )
    branch = models.ForeignKey(
        "core_admin.Branch",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="payment_entries",
    )
    payment_type = models.CharField(
        max_length=30,
        choices=PAYMENT_TYPE_VALUESET.as_django_choices(),
        default="RECEIVE",
    )
    posting_date = models.DateField()
    paid_from_account = models.ForeignKey(
        Account,
        on_delete=models.PROTECT,
        related_name="payments_sent",
    )
    paid_to_account = models.ForeignKey(
        Account,
        on_delete=models.PROTECT,
        related_name="payments_received",
    )
    paid_amount = models.DecimalField(max_digits=18, decimal_places=2, default=0.0)
    received_amount = models.DecimalField(max_digits=18, decimal_places=2, default=0.0)
    reference_number = models.CharField(max_length=100, blank=True, null=True, help_text="Cheque / UTR / Transaction Ref")
    reference_date = models.DateField(blank=True, null=True)
    is_submitted = models.BooleanField(default=False)

    class Meta(BaseModel.Meta):
        db_table = "accounting_payment_entries"
        ordering = ["-posting_date", "-created_at"]
        verbose_name = "Payment Entry"
        verbose_name_plural = "Payment Entries"

    def __str__(self):
        return f"Payment #{self.payment_number} ({self.payment_type}) - ${self.paid_amount}"


class PaymentEntryReference(BaseModel):
    """
    Invoice Allocation Reference linking Payment Entry to specific Sales / Purchase Invoices.
    """

    id = CustomShortUUIDField(primary_key=True, prefix="per_")
    payment_entry = models.ForeignKey(
        PaymentEntry,
        on_delete=models.CASCADE,
        related_name="references",
    )
    voucher_type = models.CharField(max_length=50, help_text="Sales Invoice or Purchase Invoice")
    voucher_no = models.CharField(max_length=100)
    voucher_id = models.CharField(max_length=50)
    total_amount = models.DecimalField(max_digits=18, decimal_places=2, default=0.0)
    outstanding_amount = models.DecimalField(max_digits=18, decimal_places=2, default=0.0)
    allocated_amount = models.DecimalField(max_digits=18, decimal_places=2, default=0.0)

    class Meta(BaseModel.Meta):
        db_table = "accounting_payment_entry_references"
        verbose_name = "Payment Entry Reference"
        verbose_name_plural = "Payment Entry References"

    def __str__(self):
        return f"Ref #{self.voucher_no}: Allocated ${self.allocated_amount}"
