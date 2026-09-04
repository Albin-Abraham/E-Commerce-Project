from django.db import models
from core.base_models.validator_model import BaseModel
from core.base_models.fields.short_ui_fields import CustomShortUUIDField
from core.base_models.fields.char_fields import CustomCharField
from core.base_models.validators.rules import RequiredRule, UniqueRule
from apps.accounting.models.chart_of_accounts import Account
from shared_domain.base.valuesets import ValueSet, ValueSetItem

TAX_CATEGORY_VALUESET = ValueSet(
    name="TAX_CATEGORY",
    domain="accounting",
    description="Classification of tax rules and compliance regimes",
    items=[
        ValueSetItem(code="VAT", label="Value Added Tax (VAT)", is_active=True),
        ValueSetItem(code="GST", label="Goods and Services Tax (GST)", is_active=True),
        ValueSetItem(code="SALES_TAX", label="Standard Sales Tax", is_active=True),
        ValueSetItem(code="EXCISE", label="Excise Duty", is_active=True),
        ValueSetItem(code="ZERO_RATED", label="Zero Rated / Exempt", is_active=True),
    ],
)



class SalesTaxTemplate(BaseModel):
    """
    Sales Tax Template applied to commercial Sales Orders and Sales Invoices.
    """

    id = CustomShortUUIDField(primary_key=True, prefix="stax_")
    title = CustomCharField(
        max_length=150,
        rules=[RequiredRule("title")],
        help_text="e.g. Standard VAT 18%, State Sales Tax 5%",
    )
    company = models.ForeignKey(
        "core_admin.Company",
        on_delete=models.CASCADE,
        related_name="sales_tax_templates",
    )
    tax_category = models.CharField(
        max_length=30,
        choices=TAX_CATEGORY_VALUESET.as_django_choices(),
        default="VAT",
    )
    is_inclusive = models.BooleanField(
        default=False,
        help_text="If true, item prices already include this tax amount",
    )
    is_default = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    class Meta(BaseModel.Meta):
        db_table = "accounting_sales_tax_templates"
        verbose_name = "Sales Tax Template"
        verbose_name_plural = "Sales Tax Templates"

    def __str__(self):
        return f"{self.title} ({'Inclusive' if self.is_inclusive else 'Exclusive'})"


class SalesTaxDetail(BaseModel):
    """
    Tax Rate Line item inside a Sales Tax Template.
    Links directly to a GL Output Tax Account (Liability).
    """

    id = CustomShortUUIDField(primary_key=True, prefix="staxl_")
    template = models.ForeignKey(
        SalesTaxTemplate,
        on_delete=models.CASCADE,
        related_name="tax_lines",
    )
    tax_name = CustomCharField(max_length=100, rules=[RequiredRule("tax_name")])
    rate = models.DecimalField(max_digits=6, decimal_places=3, help_text="Tax percentage rate e.g. 18.000")
    account = models.ForeignKey(
        Account,
        on_delete=models.PROTECT,
        related_name="sales_tax_details",
        help_text="GL Output Tax Account (Tax Payable)",
    )

    class Meta(BaseModel.Meta):
        db_table = "accounting_sales_tax_details"
        verbose_name = "Sales Tax Detail Line"
        verbose_name_plural = "Sales Tax Detail Lines"

    def __str__(self):
        return f"{self.tax_name} ({self.rate}%) -> Acc {self.account.account_code}"


class PurchaseTaxTemplate(BaseModel):
    """
    Purchase Tax Template applied to Procurement Purchase Orders and Invoices.
    """

    id = CustomShortUUIDField(primary_key=True, prefix="ptax_")
    title = CustomCharField(
        max_length=150,
        rules=[RequiredRule("title")],
        help_text="e.g. Vendor Input VAT 18%, Input GST 12%",
    )
    company = models.ForeignKey(
        "core_admin.Company",
        on_delete=models.CASCADE,
        related_name="purchase_tax_templates",
    )
    tax_category = models.CharField(
        max_length=30,
        choices=TAX_CATEGORY_VALUESET.as_django_choices(),
        default="VAT",
    )
    is_inclusive = models.BooleanField(default=False)
    is_default = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    class Meta(BaseModel.Meta):
        db_table = "accounting_purchase_tax_templates"
        verbose_name = "Purchase Tax Template"
        verbose_name_plural = "Purchase Tax Templates"

    def __str__(self):
        return f"{self.title}"


class PurchaseTaxDetail(BaseModel):
    """
    Tax Rate Line item inside a Purchase Tax Template.
    Links directly to a GL Input Tax Account (Asset / Tax Credit).
    """

    id = CustomShortUUIDField(primary_key=True, prefix="ptaxl_")
    template = models.ForeignKey(
        PurchaseTaxTemplate,
        on_delete=models.CASCADE,
        related_name="tax_lines",
    )
    tax_name = CustomCharField(max_length=100, rules=[RequiredRule("tax_name")])
    rate = models.DecimalField(max_digits=6, decimal_places=3, help_text="Tax percentage rate e.g. 18.000")
    account = models.ForeignKey(
        Account,
        on_delete=models.PROTECT,
        related_name="purchase_tax_details",
        help_text="GL Input Tax Credit Account (Tax Receivable)",
    )

    class Meta(BaseModel.Meta):
        db_table = "accounting_purchase_tax_details"
        verbose_name = "Purchase Tax Detail Line"
        verbose_name_plural = "Purchase Tax Detail Lines"

    def __str__(self):
        return f"{self.tax_name} ({self.rate}%) -> Acc {self.account.account_code}"


class ItemTaxTemplate(BaseModel):
    """
    Item Tax Template for product-level tax overrides (e.g. Zero-Rated Foods, Luxury Goods 28%).
    Aligned with yafei-hospital architecture.
    """

    id = CustomShortUUIDField(primary_key=True, prefix="itax_")
    title = CustomCharField(
        max_length=150,
        rules=[RequiredRule("title")],
        help_text="e.g. Zero-Rated Essentials (0%), Reduced Rate Books (5%), Luxury Rate (28%)",
    )
    company = models.ForeignKey(
        "core_admin.Company",
        on_delete=models.CASCADE,
        related_name="item_tax_templates",
    )
    tax_category = models.CharField(
        max_length=30,
        choices=TAX_CATEGORY_VALUESET.as_django_choices(),
        default="VAT",
    )
    is_active = models.BooleanField(default=True)

    class Meta(BaseModel.Meta):
        db_table = "accounting_item_tax_templates"
        verbose_name = "Item Tax Template"
        verbose_name_plural = "Item Tax Templates"

    def __str__(self):
        return f"{self.title}"


class ItemTaxDetail(BaseModel):
    """
    Tax Rate Detail Line inside an Item Tax Template.
    """

    id = CustomShortUUIDField(primary_key=True, prefix="itaxl_")
    template = models.ForeignKey(
        ItemTaxTemplate,
        on_delete=models.CASCADE,
        related_name="tax_lines",
    )
    tax_name = CustomCharField(max_length=100, rules=[RequiredRule("tax_name")])
    rate = models.DecimalField(max_digits=6, decimal_places=3, help_text="Specific item tax percentage rate")
    account = models.ForeignKey(
        Account,
        on_delete=models.PROTECT,
        related_name="item_tax_details",
        help_text="GL Tax Account for item-specific tax posting",
    )

    class Meta(BaseModel.Meta):
        db_table = "accounting_item_tax_details"
        verbose_name = "Item Tax Detail Line"
        verbose_name_plural = "Item Tax Detail Lines"

    def __str__(self):
        return f"{self.tax_name} ({self.rate}%) -> Acc {self.account.account_code}"


class TaxWithholdingCategory(BaseModel):
    """
    Tax Withholding Category (TDS / WHT) for supplier payments and corporate billing.
    Aligned with yafei-hospital architecture.
    """

    id = CustomShortUUIDField(primary_key=True, prefix="wth_")
    category_name = CustomCharField(
        max_length=150,
        rules=[RequiredRule("category_name")],
        help_text="e.g. Professional Services WHT 10%, Contractor TDS 2%",
    )
    company = models.ForeignKey(
        "core_admin.Company",
        on_delete=models.CASCADE,
        related_name="tax_withholding_categories",
    )
    account = models.ForeignKey(
        Account,
        on_delete=models.PROTECT,
        related_name="tax_withholding_categories",
        help_text="GL Withholding Tax Payable / Deducted Account",
    )
    tax_rate = models.DecimalField(max_digits=6, decimal_places=3, help_text="Withholding tax percentage rate e.g. 10.000")
    single_threshold = models.DecimalField(max_digits=18, decimal_places=2, default=0.0, help_text="Single transaction threshold")
    cumulative_threshold = models.DecimalField(max_digits=18, decimal_places=2, default=0.0, help_text="Cumulative annual threshold")
    is_active = models.BooleanField(default=True)

    class Meta(BaseModel.Meta):
        db_table = "accounting_tax_withholding_categories"
        verbose_name = "Tax Withholding Category"
        verbose_name_plural = "Tax Withholding Categories"

    def __str__(self):
        return f"{self.category_name} ({self.tax_rate}%)"
