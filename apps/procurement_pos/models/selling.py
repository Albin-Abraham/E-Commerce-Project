from django.db import models, transaction
from django.utils import timezone
from core.base_models.validator_model import BaseModel
from core.base_models.constants import USER_MODEL
from core.base_models.fields.short_ui_fields import CustomShortUUIDField
from core.base_models.fields.char_fields import CustomCharField, CustomTextField
from core.base_models.validators.rules import RequiredRule, UniqueRule


from core.base_models.fields.party_mixin import PartyReferenceMixin

from apps.procurement_pos.valuesets import (
    DELIVERY_STATUS_VALUESET,
    SALES_INVOICE_STATUS_VALUESET,
    SALES_ORDER_STATUS_VALUESET,
)


class SalesOrder(BaseModel, PartyReferenceMixin):
    """
    Sales Order / Quotation Confirmation.
    Supports polymorphic party references (Customer, Partner, Employee).
    """

    id = CustomShortUUIDField(primary_key=True, prefix="so_")
    order_number = CustomCharField(
        max_length=60,
        blank=True,
        default="",
        rules=[UniqueRule("order_number")],
    )
    customer = models.ForeignKey(
        "customers.Customer",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sales_orders",
    )
    delivery_address = models.ForeignKey(
        "customers.CustomerAddress",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sales_orders",
        help_text="Delivery address line for order fulfillment",
    )
    contact_person = models.ForeignKey(
        "customers.CustomerContact",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sales_orders",
        help_text="Contact person line associated with this order",
    )
    status = models.CharField(
        max_length=20,
        choices=SALES_ORDER_STATUS_VALUESET.as_django_choices(),
        default="DRAFT",
    )
    currency = models.ForeignKey(
        "accounting.Currency",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sales_orders",
        help_text="Sales Order transaction currency",
    )
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    company = models.ForeignKey(
        "core_admin.Company",
        on_delete=models.CASCADE,
        related_name="sales_orders",
    )

    class Meta(BaseModel.Meta):
        db_table = "sales_orders"
        ordering = ["-created_at"]
        verbose_name = "Sales Order"
        verbose_name_plural = "Sales Orders"

    def __str__(self):
        curr_str = self.currency.format_amount(self.total_amount) if self.currency else f"${self.total_amount}"
        return f"SO #{self.order_number} ({curr_str})"

    @property
    def charges(self):
        """
        Charge items applied to this Sales Order (Shipping, Handling, Discounts, Surcharges).
        """
        from apps.accounting.models.charges import ChargeItem
        return ChargeItem.for_document(self)


class DeliveryNote(BaseModel):
    """
    Delivery Note / Goods Outward Note.
    Links Sales Order to physical warehouse stock dispatch.
    """

    id = CustomShortUUIDField(primary_key=True, prefix="dn_")
    delivery_number = CustomCharField(
        max_length=60,
        blank=True,
        default="",
        rules=[UniqueRule("delivery_number")],
    )
    sales_order = models.ForeignKey(
        SalesOrder,
        on_delete=models.CASCADE,
        related_name="delivery_notes",
    )
    warehouse = models.ForeignKey(
        "shop.Warehouse",
        on_delete=models.PROTECT,
    )
    status = models.CharField(
        max_length=20,
        choices=DELIVERY_STATUS_VALUESET.as_django_choices(),
        default="DRAFT",
    )
    tracking_number = models.CharField(max_length=100, blank=True, null=True)

    class Meta(BaseModel.Meta):
        db_table = "sales_delivery_notes"
        ordering = ["-created_at"]
        verbose_name = "Delivery Note"
        verbose_name_plural = "Delivery Notes"

    def __str__(self):
        return f"Delivery Note #{self.delivery_number} for SO #{self.sales_order.order_number}"


class SalesInvoice(BaseModel, PartyReferenceMixin):
    """
    Sales Invoice for B2C & B2B Commercial Billing and Accounts Receivable (AR).
    Inherits PartyReferenceMixin for polymorphic Customer, Partner, or Enterprise party links.
    """

    id = CustomShortUUIDField(primary_key=True, prefix="sinv_")
    invoice_number = CustomCharField(
        max_length=60,
        blank=True,
        default="",
        rules=[UniqueRule("invoice_number")],
    )
    sales_order = models.ForeignKey(
        SalesOrder,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sales_invoices",
    )
    company = models.ForeignKey(
        "core_admin.Company",
        on_delete=models.CASCADE,
        related_name="sales_invoices",
    )
    posting_date = models.DateField(default=timezone.now)
    due_date = models.DateField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=SALES_INVOICE_STATUS_VALUESET.as_django_choices(),
        default="DRAFT",
    )
    sales_tax_template = models.ForeignKey(
        "accounting.SalesTaxTemplate",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sales_invoices",
    )
    currency = models.ForeignKey(
        "accounting.Currency",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sales_invoices",
        help_text="Sales Invoice transaction currency",
    )
    net_total = models.DecimalField(max_digits=18, decimal_places=2, default=0.0)
    tax_amount = models.DecimalField(max_digits=18, decimal_places=2, default=0.0)
    grand_total = models.DecimalField(max_digits=18, decimal_places=2, default=0.0)
    paid_amount = models.DecimalField(max_digits=18, decimal_places=2, default=0.0)
    outstanding_amount = models.DecimalField(max_digits=18, decimal_places=2, default=0.0)

    class Meta(BaseModel.Meta):
        db_table = "sales_invoices"
        ordering = ["-posting_date", "-created_at"]
        verbose_name = "Sales Invoice"
        verbose_name_plural = "Sales Invoices"

    def __str__(self):
        curr_str = self.currency.format_amount(self.grand_total) if self.currency else f"${self.grand_total}"
        return f"Sales Invoice #{self.invoice_number} ({curr_str})"

    @property
    def charges(self):
        """
        Charge items applied to this Sales Invoice (Shipping, Handling, Discounts, Surcharges).
        """
        from apps.accounting.models.charges import ChargeItem
        return ChargeItem.for_document(self)


class SalesInvoiceItem(BaseModel):
    """
    Line Item inside a Sales Invoice.
    """

    id = CustomShortUUIDField(primary_key=True, prefix="sinvi_")
    sales_invoice = models.ForeignKey(
        SalesInvoice,
        on_delete=models.CASCADE,
        related_name="items",
    )
    product = models.ForeignKey(
        "shop.Product",
        on_delete=models.PROTECT,
        related_name="sales_invoice_items",
    )
    variant = models.ForeignKey(
        "shop.ProductVariant",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sales_invoice_items",
    )
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    amount = models.DecimalField(max_digits=18, decimal_places=2, default=0.0)

    class Meta(BaseModel.Meta):
        db_table = "sales_invoice_items"
        verbose_name = "Sales Invoice Item"
        verbose_name_plural = "Sales Invoice Items"

    def _override_pre_save(self, is_creating: bool):
        self.amount = self.unit_price * self.quantity

    def __str__(self):
        curr = self.sales_invoice.currency if self.sales_invoice else None
        curr_str = curr.format_amount(self.amount) if curr else f"${self.amount}"
        return f"{self.quantity}x {self.product.name} ({curr_str})"
