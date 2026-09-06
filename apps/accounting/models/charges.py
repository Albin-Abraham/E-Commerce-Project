from decimal import Decimal

from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models, transaction

from core.base_models.fields.char_fields import CustomCharField
from core.base_models.fields.numeric_fields import CustomDecimalField
from core.base_models.fields.short_ui_fields import CustomShortUUIDField
from core.base_models.validator_model import BaseModel
from core.base_models.validators.rules import RequiredRule, UniqueRule

from apps.accounting.valuesets import (
    CHARGE_BASED_ON_VALUESET,
    CHARGE_SCOPE_VALUESET,
    CHARGE_TYPE_VALUESET,
)


class ChargeDefinition(BaseModel):
    """
    Master charge definition (Shipping, Handling, Service Charge, Discounts, Tax Surcharges).
    Scoped to a Company and linked to the GL Account it posts to, plus the Sales /
    Purchase / Item tax templates whose rates drive its tax posting.
    """

    id = CustomShortUUIDField(primary_key=True, prefix="chgd_")
    company = models.ForeignKey(
        "core_admin.Company",
        on_delete=models.CASCADE,
        related_name="charge_definitions",
        help_text="Company this charge definition belongs to",
    )
    code = CustomCharField(
        max_length=50,
        rules=[RequiredRule("code"), UniqueRule("code", extra_filters={"company": "company"})],
        help_text="Unique charge code per company e.g. FLAT_SHIPPING, HANDLING_5PCT",
    )
    title = CustomCharField(
        max_length=150,
        rules=[RequiredRule("title")],
        help_text="Human readable label e.g. Flat Rate Shipping, Holiday Discount 10%",
    )
    description = models.TextField(blank=True)
    charge_type = models.CharField(
        max_length=30,
        choices=CHARGE_TYPE_VALUESET.as_django_choices(),
        default="ADDITIONAL",
        help_text="Whether the charge adds to or reduces the document total",
    )
    based_on = models.CharField(
        max_length=30,
        choices=CHARGE_BASED_ON_VALUESET.as_django_choices(),
        default="FIXED_AMOUNT",
        help_text="Basis used to compute the charge amount",
    )
    rate = CustomDecimalField(
        max_digits=8,
        decimal_places=3,
        default=0,
        help_text="Percentage rate for PERCENTAGE charges, or per-unit value for PER_UNIT charges",
    )
    amount = CustomDecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        help_text="Fixed amount for FIXED_AMOUNT charges",
    )
    account = models.ForeignKey(
        "accounting.Account",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="charge_definitions",
        help_text="GL account the charge amount posts to (e.g. Shipping Income, Service Charge)",
    )
    sales_tax_template = models.ForeignKey(
        "accounting.SalesTaxTemplate",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="charge_definitions",
        help_text="Sales tax template whose rates drive tax on this charge for sales documents",
    )
    purchase_tax_template = models.ForeignKey(
        "accounting.PurchaseTaxTemplate",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="charge_definitions",
        help_text="Purchase tax template whose rates drive tax on this charge for purchase documents",
    )
    item_tax_template = models.ForeignKey(
        "accounting.ItemTaxTemplate",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="charge_definitions",
        help_text="Item-level tax template fallback for charge tax computation",
    )
    tax_pack = models.ForeignKey(
        "accounting.TaxRatePack",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="charge_definitions",
        help_text="Branch/country tax pack used when no explicit tax template is set",
    )
    discount_configuration = models.ForeignKey(
        "accounting.DiscountConfiguration",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="charge_definitions",
        help_text="Opt-in discount config that drives automatic DISCOUNT charges",
    )
    scope = models.CharField(
        max_length=30,
        choices=CHARGE_SCOPE_VALUESET.as_django_choices(),
        default="ALL",
        help_text="Documents this charge may be applied to",
    )
    is_inclusive = models.BooleanField(
        default=False,
        help_text="If true, the charge amount already includes its tax",
    )
    is_active = models.BooleanField(default=True)
    metadata = models.JSONField(default=dict, blank=True)

    permission_prefix = "accounting:charge"

    class Meta(BaseModel.Meta):
        db_table = "accounting_charge_definitions"
        ordering = ["-created_at"]
        verbose_name = "Charge Definition"
        verbose_name_plural = "Charge Definitions"

    def __str__(self):
        return f"{self.title} ({self.code})"


class ChargeItem(BaseModel):
    """
    A charge applied to a concrete transaction document (Sales Order, Purchase Order,
    Sales Invoice, Purchase Invoice, POS Transaction, Shop Order).

    Polymorphically links to its parent document via ContentType/GFK so the accounting
    app never creates a hard import cycle with procurement / shop / pos.
    Amounts and tax are computed (and snapshotted) from the linked ChargeDefinition
    and its accompanied tax templates on every save.
    """

    # Mapping of parent document -> field holding the chargeable subtotal basis.
    _SUPPORTED_DOCUMENTS = {
        "procurement_pos.salesorder": "total_amount",
        "procurement_pos.salesinvoice": "net_total",
        "procurement_pos.purchaseorder": "total_amount",
        "procurement_pos.purchaseinvoice": "billed_amount",
        "procurement_pos.postransaction": "total_amount",
        "shop.order": "total_amount",
    }

    id = CustomShortUUIDField(primary_key=True, prefix="chg_")
    definition = models.ForeignKey(
        ChargeDefinition,
        on_delete=models.PROTECT,
        related_name="charge_items",
    )
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        help_text="Polymorphic parent document type (SalesOrder, PurchaseOrder, Invoice, POS, Shop Order)",
    )
    object_id = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        db_index=True,
        help_text="Polymorphic parent document primary key",
    )
    parent_document = GenericForeignKey("content_type", "object_id")

    # Snapshots copied from the ChargeDefinition at creation time.
    charge_type = models.CharField(
        max_length=30,
        choices=CHARGE_TYPE_VALUESET.as_django_choices(),
        default="ADDITIONAL",
    )
    based_on = models.CharField(
        max_length=30,
        choices=CHARGE_BASED_ON_VALUESET.as_django_choices(),
        default="FIXED_AMOUNT",
    )
    rate = CustomDecimalField(max_digits=8, decimal_places=3, default=0)
    amount = CustomDecimalField(max_digits=12, decimal_places=2, default=0)
    description = models.CharField(max_length=255, blank=True)

    currency = models.ForeignKey(
        "accounting.Currency",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="charge_items",
    )
    sales_tax_template = models.ForeignKey(
        "accounting.SalesTaxTemplate",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="charge_items",
    )
    purchase_tax_template = models.ForeignKey(
        "accounting.PurchaseTaxTemplate",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="charge_items",
    )
    item_tax_template = models.ForeignKey(
        "accounting.ItemTaxTemplate",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="charge_items",
    )
    is_inclusive = models.BooleanField(default=False)

    # Computed amounts: net charge, its tax, and the gross total (net + tax).
    net_amount = models.DecimalField(max_digits=18, decimal_places=2, default=0.0)
    tax_rate = models.DecimalField(max_digits=8, decimal_places=3, default=0.0)
    tax_amount = models.DecimalField(max_digits=18, decimal_places=2, default=0.0)
    total_amount = models.DecimalField(max_digits=18, decimal_places=2, default=0.0)

    permission_prefix = "accounting:charge"

    class Meta(BaseModel.Meta):
        db_table = "accounting_charge_items"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["content_type", "object_id"], name="chg_item_doc_idx"),
            models.Index(fields=["definition"], name="chg_item_def_idx"),
        ]
        verbose_name = "Charge Item"
        verbose_name_plural = "Charge Items"

    def __str__(self):
        sign = "-" if self.charge_type == "DISCOUNT" else "+"
        return f"{sign} {self.description or self.definition.title}: {self.total_amount}"

    def _document_key(self):
        doc = self.parent_document
        if doc is None:
            return None
        return f"{doc._meta.app_label}.{doc._meta.model_name}"

    def _basis_amount(self) -> Decimal:
        key = self._document_key()
        attr = self._SUPPORTED_DOCUMENTS.get(key)
        if not attr:
            return Decimal("0")
        value = getattr(self.parent_document, attr, None)
        return Decimal(value) if value is not None else Decimal("0")

    def _applicable_tax_template(self):
        key = self._document_key()
        if key in ("procurement_pos.purchaseorder", "procurement_pos.purchaseinvoice"):
            template = self.purchase_tax_template or self.item_tax_template
        elif key in ("procurement_pos.salesorder", "procurement_pos.salesinvoice"):
            template = self.sales_tax_template or self.item_tax_template
        else:
            template = self.item_tax_template
        if template is None and self.definition_id:
            template = self.definition.tax_pack
        return template

    def _populate_from_definition(self):
        definition = self.definition
        if definition is None:
            return
        if not self.description:
            self.description = definition.title
        if self.based_on in ("", None):
            self.based_on = definition.based_on
        if not self.rate:
            self.rate = definition.rate
        if not self.amount:
            self.amount = definition.amount
        if self.sales_tax_template_id is None:
            self.sales_tax_template = definition.sales_tax_template
        if self.purchase_tax_template_id is None:
            self.purchase_tax_template = definition.purchase_tax_template
        if self.item_tax_template_id is None:
            self.item_tax_template = definition.item_tax_template

    def recompute(self):
        """
        Recalculates net_amount / tax_amount / total_amount from the current
        snapshot and the parent document basis. Call explicitly when the linked
        definition or tax template changes after creation.
        """
        from apps.accounting.services.tax_engine import TaxEngineService

        self._populate_from_definition()
        basis = self._basis_amount()

        if self.based_on == "PERCENTAGE":
            net = (basis * self.rate) / Decimal("100")
        elif self.based_on == "PER_UNIT":
            net = self.rate
        else:
            net = self.amount

        self.net_amount = net.quantize(Decimal("0.01"))

        template = self._applicable_tax_template()
        engine = TaxEngineService()
        if self._document_key() in ("procurement_pos.purchaseorder", "procurement_pos.purchaseinvoice"):
            result = engine.calculate_purchase_tax(self.net_amount, template)
        else:
            result = engine.calculate_sales_tax(self.net_amount, template)

        self.is_inclusive = bool(result.is_inclusive)
        total_rate = sum((line.rate for line in result.breakdown), Decimal("0"))
        self.tax_rate = total_rate.quantize(Decimal("0.001"))
        self.net_amount = result.net_amount
        self.tax_amount = result.total_tax_amount
        self.total_amount = result.gross_amount

    def _override_pre_save(self, is_creating: bool):
        if not self.content_type_id:
            return
        self.recompute()

    @classmethod
    def for_document(cls, document):
        """Returns all charge items applied to the given document."""
        if document is None:
            return cls.objects.none()
        content_type = ContentType.objects.get_for_model(document)
        return cls.objects.filter(
            content_type=content_type,
            object_id=str(document.pk),
        )

    @classmethod
    @transaction.atomic
    def attach_to(
        cls,
        document,
        definition,
        description=None,
        rate=None,
        amount=None,
        currency=None,
    ):
        """
        Applies a ChargeDefinition to a document and persists the computed ChargeItem.
        Snapshots the definition's type, basis, rate, amount, and tax templates
        so later edits to the definition do not silently change historical charges.
        """
        content_type = ContentType.objects.get_for_model(document)
        item = cls(
            definition=definition,
            content_type=content_type,
            object_id=str(document.pk),
            currency=currency,
        )
        item.charge_type = definition.charge_type
        item.based_on = definition.based_on
        item.rate = rate if rate is not None else definition.rate
        item.amount = amount if amount is not None else definition.amount
        item.description = description or definition.title
        item.sales_tax_template = definition.sales_tax_template
        item.purchase_tax_template = definition.purchase_tax_template
        item.item_tax_template = definition.item_tax_template
        item.is_inclusive = definition.is_inclusive
        item.save()
        return item

    @classmethod
    def summary(cls, document):
        """
        Aggregate the applied charges for a document.
        Discount charges reduce the totals; all other charges add to them.
        """
        from decimal import Decimal as D

        items = list(cls.for_document(document))
        net_total = D("0")
        tax_total = D("0")
        for item in items:
            sign = D("-1") if item.charge_type == "DISCOUNT" else D("1")
            net_total += sign * item.net_amount
            tax_total += sign * item.tax_amount
        return {
            "count": len(items),
            "net_total": net_total,
            "tax_total": tax_total,
            "grand_total": net_total + tax_total,
        }