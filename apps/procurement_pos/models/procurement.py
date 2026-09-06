from django.db import models, transaction
from django.utils import timezone
from core.base_models.validator_model import BaseModel
from core.base_models.constants import USER_MODEL
from core.base_models.fields.short_ui_fields import CustomShortUUIDField
from core.base_models.fields.char_fields import CustomCharField, CustomTextField
from core.base_models.validators.rules import RequiredRule, UniqueRule, MinRule


class Supplier(BaseModel):
    id = CustomShortUUIDField(primary_key=True, prefix="sup_")
    name = CustomCharField(
        max_length=150,
        rules=[RequiredRule("name"), UniqueRule("name")],
    )
    code = CustomCharField(
        max_length=50,
        rules=[RequiredRule("code"), UniqueRule("code")],
    )
    contact_person = models.CharField(max_length=100, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=30, blank=True, null=True)
    address = CustomTextField(nullable=True)
    tax_id = models.CharField(max_length=50, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    metadata = models.JSONField(default=dict, blank=True)

    permission_prefix = "procurement:supplier"

    class Meta(BaseModel.Meta):
        db_table = "procurement_suppliers"
        ordering = ["name"]
        verbose_name = "Supplier"
        verbose_name_plural = "Suppliers"

    def __str__(self):
        return f"{self.name} ({self.code})"


from apps.procurement_pos.valuesets import (
    GRN_STATUS_VALUESET,
    PO_ITEM_STATUS_VALUESET,
    PO_STATUS_VALUESET,
    PR_STATUS_VALUESET,
    PURCHASE_INVOICE_STATUS_VALUESET,
    RFQ_STATUS_VALUESET,
)


class PurchaseRequest(BaseModel):
    """
    Internal Material Requisition / Purchase Request from departments.
    """

    id = CustomShortUUIDField(primary_key=True, prefix="pr_")
    request_number = CustomCharField(
        max_length=50,
        blank=True,
        default="",
        rules=[UniqueRule("request_number")],
    )
    requested_by = models.ForeignKey(
        USER_MODEL,
        on_delete=models.CASCADE,
        related_name="purchase_requests",
    )
    department = models.CharField(max_length=100, blank=True, null=True)
    status = models.CharField(
        max_length=30,
        choices=PR_STATUS_VALUESET.as_django_choices(),
        default="DRAFT",
    )
    required_date = models.DateField(null=True, blank=True)
    notes = CustomTextField(nullable=True)

    class Meta(BaseModel.Meta):
        db_table = "procurement_purchase_requests"
        ordering = ["-created_at"]
        verbose_name = "Purchase Request"
        verbose_name_plural = "Purchase Requests"

    def __str__(self):
        return f"PR #{self.request_number} by {self.requested_by.username}"

    def _transition(self, new_status):
        self.status = new_status
        self.save(update_fields=["status", "updated_at"])
        return self

    def submit(self):
        return self._transition("SUBMITTED")

    def approve(self):
        return self._transition("APPROVED")

    def mark_po_created(self):
        return self._transition("PO_CREATED")

    def reject(self):
        return self._transition("REJECTED")


class RequestForQuotation(BaseModel):
    """
    Request for Quotation (RFQ) issued to multiple suppliers.
    """

    id = CustomShortUUIDField(primary_key=True, prefix="rfq_")
    rfq_number = CustomCharField(
        max_length=50,
        blank=True,
        default="",
        rules=[UniqueRule("rfq_number")],
    )
    purchase_request = models.ForeignKey(
        PurchaseRequest,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="rfqs",
    )
    status = models.CharField(
        max_length=20,
        choices=RFQ_STATUS_VALUESET.as_django_choices(),
        default="DRAFT",
    )
    bidding_deadline = models.DateTimeField(null=True, blank=True)

    class Meta(BaseModel.Meta):
        db_table = "procurement_rfqs"
        ordering = ["-created_at"]
        verbose_name = "Request For Quotation"
        verbose_name_plural = "Requests For Quotation"

    def __str__(self):
        return f"RFQ #{self.rfq_number}"


class VendorQuotation(BaseModel):
    """
    Quotation submitted by a Supplier in response to an RFQ.
    """
    id = CustomShortUUIDField(primary_key=True, prefix="vq_")
    rfq = models.ForeignKey(
        RequestForQuotation,
        on_delete=models.CASCADE,
        related_name="vendor_quotations",
    )
    supplier = models.ForeignKey(
        Supplier,
        on_delete=models.CASCADE,
        related_name="quotations",
    )
    quotation_number = models.CharField(max_length=60)
    total_quoted_price = models.DecimalField(max_digits=12, decimal_places=2)
    is_selected = models.BooleanField(default=False)

    class Meta(BaseModel.Meta):
        db_table = "procurement_vendor_quotations"
        verbose_name = "Vendor Quotation"
        verbose_name_plural = "Vendor Quotations"

    def __str__(self):
        return f"Quotation from {self.supplier.name} for RFQ #{self.rfq.rfq_number}"


class PurchaseOrder(BaseModel):
    class POStatus:
        DRAFT = "DRAFT"
        SUBMITTED = "SUBMITTED"
        APPROVED = "APPROVED"
        REJECTED = "REJECTED"
        CANCELLED = "CANCELLED"
        COMPLETED = "COMPLETED"

    id = CustomShortUUIDField(primary_key=True, prefix="po_")

    po_number = CustomCharField(
        max_length=50,
        blank=True,
        default="",
        rules=[UniqueRule("po_number")],
    )
    supplier = models.ForeignKey(
        Supplier,
        on_delete=models.PROTECT,
        related_name="purchase_orders",
    )
    purchase_request = models.ForeignKey(
        PurchaseRequest,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="purchase_orders",
        help_text="Source requisition this PO fulfils",
    )
    vendor_quotation = models.ForeignKey(
        VendorQuotation,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="purchase_orders",
        help_text="Selected vendor quotation this PO was created from",
    )
    status = models.CharField(
        max_length=30,
        choices=PO_STATUS_VALUESET.as_django_choices(),
        default="DRAFT",
    )
    currency = models.ForeignKey(
        "accounting.Currency",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="purchase_orders",
        help_text="Purchase Order billing currency",
    )
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    expected_delivery_date = models.DateField(null=True, blank=True)
    created_by = models.ForeignKey(
        USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_purchase_orders",
    )

    permission_prefix = "procurement:po"

    class Meta(BaseModel.Meta):
        db_table = "procurement_purchase_orders"
        ordering = ["-created_at"]
        verbose_name = "Purchase Order"
        verbose_name_plural = "Purchase Orders"

    def __str__(self):
        return f"PO #{self.po_number} - {self.supplier.name} ({self.status})"

    @property
    def charges(self):
        """
        Charge items applied to this Purchase Order (Freight, Insurance, Customs, Discounts).
        """
        from apps.accounting.models.charges import ChargeItem
        return ChargeItem.for_document(self)

    def set_status(self, new_status, user=None, description=None):
        """
        Transition the PO to a new status and record a tracking event.
        No duplicate event is written when the status is unchanged.
        """
        if new_status == self.status:
            return self
        self.status = new_status
        self.save(update_fields=["status", "updated_at"])
        self.log_event(new_status, user, description)
        return self

    def log_event(self, status, user=None, description=None):
        from .tracking import PurchaseOrderEvent
        return PurchaseOrderEvent.objects.create(
            purchase_order=self,
            status=status,
            description=description,
            changed_by=user,
        )

    def submit(self, user=None):
        return self.set_status("SUBMITTED", user, "PO submitted to supplier")

    def approve(self, user=None):
        return self.set_status("APPROVED", user, "PO approved")

    def reject(self, user=None):
        return self.set_status("REJECTED", user, "PO rejected")

    def cancel(self, user=None):
        return self.set_status("CANCELLED", user, "PO cancelled")


class PurchaseOrderItem(BaseModel):
    id = CustomShortUUIDField(primary_key=True, prefix="poi_")
    purchase_order = models.ForeignKey(
        PurchaseOrder,
        on_delete=models.CASCADE,
        related_name="items",
    )
    variant = models.ForeignKey(
        "shop.ProductVariant",
        on_delete=models.PROTECT,
        related_name="po_items",
    )
    quantity_ordered = models.PositiveIntegerField()
    quantity_received = models.PositiveIntegerField(default=0)
    unit_cost = models.DecimalField(max_digits=12, decimal_places=2)
    total_cost = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(
        max_length=20,
        choices=PO_ITEM_STATUS_VALUESET.as_django_choices(),
        default="PENDING",
    )

    class Meta(BaseModel.Meta):
        db_table = "procurement_po_items"
        verbose_name = "PO Item"
        verbose_name_plural = "PO Items"

    def _override_pre_save(self, is_creating: bool):
        self.total_cost = self.quantity_ordered * self.unit_cost

    @property
    def remaining_quantity(self):
        """Quantity still due for delivery after already received amounts."""
        return self.quantity_ordered - self.quantity_received

    @property
    def is_fully_received(self):
        return self.remaining_quantity <= 0

    @property
    def is_partially_received(self):
        return 0 < self.quantity_received < self.quantity_ordered


class GoodsReceivedNote(BaseModel):

    id = CustomShortUUIDField(primary_key=True, prefix="grn_")
    grn_number = CustomCharField(
        max_length=50,
        blank=True,
        default="",
        rules=[UniqueRule("grn_number")],
    )
    purchase_order = models.ForeignKey(
        PurchaseOrder,
        on_delete=models.CASCADE,
        related_name="grns",
    )
    warehouse = models.ForeignKey(
        "shop.Warehouse",
        on_delete=models.PROTECT,
        related_name="grns",
    )
    received_by = models.ForeignKey(
        USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
    )
    status = models.CharField(
        max_length=20,
        choices=GRN_STATUS_VALUESET.as_django_choices(),
        default="DRAFT",
    )
    received_at = models.DateTimeField(default=timezone.now)

    class Meta(BaseModel.Meta):
        db_table = "procurement_grn"
        ordering = ["-created_at"]
        verbose_name = "Goods Received Note"
        verbose_name_plural = "Goods Received Notes"

    @classmethod
    @transaction.atomic
    def process_grn_receipt(cls, grn_id: str):
        from django.core.exceptions import ValidationError
        from apps.shop.infrastructure.models.inventory import Inventory
        grn = cls.objects.select_related("purchase_order", "warehouse").get(pk=grn_id)
        if grn.status == "COMPLETED":
            return grn

        po = grn.purchase_order
        if po.status in ("CANCELLED", "REJECTED"):
            raise ValidationError(
                f"Cannot receive goods against a PO in status '{po.status}'."
            )
        po_items = po.items.all()

        if grn.lines.exists():
            for line in grn.lines.select_related("purchase_order_item", "variant"):
                item = line.purchase_order_item
                if item.quantity_received >= item.quantity_ordered:
                    continue
                receive_qty = min(line.quantity_received, item.remaining_quantity)
                inv, created = Inventory.objects.get_or_create(
                    variant=item.variant,
                    warehouse=grn.warehouse,
                    defaults={"quantity": receive_qty},
                )
                if not created:
                    inv.quantity = models.F("quantity") + receive_qty
                    inv.save(update_fields=["quantity", "updated_at"])
                item.quantity_received += receive_qty
                item.save(update_fields=["quantity_received", "updated_at"])
                item.refresh_from_db()
                if item.is_fully_received:
                    item.status = "RECEIVED"
                elif item.quantity_received > 0:
                    item.status = "PARTIAL"
                item.save(update_fields=["status", "updated_at"])
        else:
            for item in po_items:
                inv, created = Inventory.objects.get_or_create(
                    variant=item.variant,
                    warehouse=grn.warehouse,
                    defaults={"quantity": item.quantity_ordered},
                )
                if not created:
                    inv.quantity = models.F("quantity") + item.quantity_ordered
                    inv.save(update_fields=["quantity", "updated_at"])
                item.quantity_received = item.quantity_ordered
                item.status = "RECEIVED"
                item.save(update_fields=["quantity_received", "status", "updated_at"])

        grn.status = "COMPLETED"
        grn.save(update_fields=["status", "updated_at"])

        po.refresh_from_db()
        items = po.items.all()
        if items and all(i.is_fully_received for i in items):
            po.set_status("COMPLETED", description="All PO lines fully received")
        elif any(i.quantity_received > 0 for i in items):
            po.set_status("PARTIALLY_RECEIVED", description="Partial goods received")

        return grn


class GoodsReceivedNoteLine(BaseModel):
    """
    Line-level receipt: captures the exact quantity received per PO item inside a GRN.
    Enables partial deliveries and per-line purchase tracking.
    """

    id = CustomShortUUIDField(primary_key=True, prefix="grnl_")
    goods_received_note = models.ForeignKey(
        GoodsReceivedNote,
        on_delete=models.CASCADE,
        related_name="lines",
    )
    purchase_order_item = models.ForeignKey(
        PurchaseOrderItem,
        on_delete=models.CASCADE,
        related_name="grn_lines",
    )
    variant = models.ForeignKey(
        "shop.ProductVariant",
        on_delete=models.PROTECT,
        related_name="grn_lines",
    )
    quantity_received = models.PositiveIntegerField()
    unit_cost = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta(BaseModel.Meta):
        db_table = "procurement_grn_lines"
        verbose_name = "GRN Line"
        verbose_name_plural = "GRN Lines"

    def _override_pre_save(self, is_creating: bool):
        from django.core.exceptions import ValidationError
        if is_creating and self.quantity_received > self.purchase_order_item.remaining_quantity:
            raise ValidationError(
                f"Cannot receive {self.quantity_received} for PO item "
                f"with only {self.purchase_order_item.remaining_quantity} remaining."
            )

    @property
    def total_cost(self):
        return self.quantity_received * self.unit_cost


class PurchaseInvoice(BaseModel):
    """
    Vendor Purchase Invoice.
    Enforces 3-Way Matching Engine: Purchase Order + Goods Received Note + Purchase Invoice.
    """

    id = CustomShortUUIDField(primary_key=True, prefix="piv_")
    invoice_number = CustomCharField(
        max_length=60,
        blank=True,
        default="",
        rules=[UniqueRule("invoice_number")],
    )
    purchase_order = models.ForeignKey(
        PurchaseOrder,
        on_delete=models.CASCADE,
        related_name="invoices",
    )
    goods_received_note = models.ForeignKey(
        GoodsReceivedNote,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="invoices",
    )
    supplier = models.ForeignKey(
        Supplier,
        on_delete=models.PROTECT,
    )
    billed_amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(
        max_length=20,
        choices=PURCHASE_INVOICE_STATUS_VALUESET.as_django_choices(),
        default="DRAFT",
    )

    class Meta(BaseModel.Meta):
        db_table = "procurement_purchase_invoices"
        ordering = ["-created_at"]
        verbose_name = "Purchase Invoice"
        verbose_name_plural = "Purchase Invoices"

    @property
    def charges(self):
        """
        Charge items applied to this Purchase Invoice (Freight, Insurance, Customs, Discounts).
        """
        from apps.accounting.models.charges import ChargeItem
        return ChargeItem.for_document(self)

    @classmethod
    def execute_three_way_match(cls, invoice_id: str) -> bool:
        """
        3-Way Matching Engine: Purchase Order ordered totals, GRN received quantity,
        and Invoice billed amount must all agree before the invoice is accepted for payment.

        Conditions:
          - GRN exists and is COMPLETED
          - every PO line is fully received (no open / partial quantities)
          - PO total amount matches the invoice billed amount
        Any deviation flags the invoice MISMATCH so it cannot drive payment.
        """
        inv = cls.objects.select_related("purchase_order", "goods_received_note").get(pk=invoice_id)
        po = inv.purchase_order
        grn = inv.goods_received_note

        def mismatch():
            inv.status = "MISMATCH"
            inv.save(update_fields=["status", "updated_at"])
            return False

        if not grn or grn.status != "COMPLETED":
            return mismatch()

        items = po.items.all()
        if not items or not all(item.is_fully_received for item in items):
            return mismatch()

        if abs(po.total_amount - inv.billed_amount) >= 0.01:
            return mismatch()

        inv.status = "MATCHED"
        inv.save(update_fields=["status", "updated_at"])
        return True
