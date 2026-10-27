from django.db import models
from django.utils import timezone
from core.base_models.validator_model import BaseModel
from core.base_models.scoping_models import TenantModelMixin
from core.base_models.fields.short_ui_fields import CustomShortUUIDField
from core.base_models.fields.char_fields import CustomCharField
from core.base_models.fields.numeric_fields import CustomDecimalField, CustomIntegerField
from core.base_models.fields.boolean_fields import CustomBooleanField
from core.base_models.validators.rules import RequiredRule, UniqueRule, MinRule


class PriceList(BaseModel, TenantModelMixin):
    """
    Price List Master Entity (e.g. Standard Retail, Wholesale Dealer, VIP Corporate).
    """

    id = CustomShortUUIDField(primary_key=True, prefix="pl_")
    name = CustomCharField(
        max_length=120,
        rules=[RequiredRule("name"), UniqueRule("name")],
        help_text="Price List Name (e.g. Wholesale Dealer 2026)",
    )
    code = CustomCharField(
        max_length=40,
        rules=[RequiredRule("code"), UniqueRule("code")],
        help_text="Price List Code",
    )
    currency = models.ForeignKey(
        "accounting.Currency",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    is_active = CustomBooleanField(default=True)

    permission_prefix = "shop:pricelist"

    class Meta(BaseModel.Meta):
        db_table = "shop_price_lists"
        ordering = ["name"]
        verbose_name = "Price List"
        verbose_name_plural = "Price Lists"

    def __str__(self):
        return f"{self.name} ({self.code})"


class PricingRule(BaseModel, TenantModelMixin):
    """
    Dynamic B2B Pricing Rule Engine Entity.
    Evaluates multi-parameter price breaks based on quantity, customer tier, and date ranges.
    """

    id = CustomShortUUIDField(primary_key=True, prefix="pru_")
    name = CustomCharField(
        max_length=150,
        rules=[RequiredRule("name")],
    )
    price_list = models.ForeignKey(
        PriceList,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="pricing_rules",
    )
    variant = models.ForeignKey(
        "shop.ProductVariant",
        on_delete=models.CASCADE,
        related_name="pricing_rules",
    )
    customer_group = CustomCharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="Target customer tier (e.g. WHOLESALE, DEALER, VIP)",
    )
    min_quantity = CustomIntegerField(
        default=1,
        rules=[MinRule("min_quantity", 1)],
        help_text="Minimum order quantity break",
    )
    max_quantity = CustomIntegerField(
        null=True,
        blank=True,
        help_text="Maximum order quantity break (NULL for unlimited)",
    )
    flat_price = CustomDecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Override flat unit price if specified",
    )
    discount_percentage = CustomDecimalField(
        max_digits=5,
        decimal_places=2,
        default=0.0,
        rules=[MinRule("discount_percentage", 0.0)],
        help_text="Discount percentage applied to baseline price",
    )
    valid_from = models.DateTimeField(null=True, blank=True)
    valid_to = models.DateTimeField(null=True, blank=True)
    priority = CustomIntegerField(
        default=0,
        help_text="Higher priority rules take precedence over lower priority rules",
    )
    is_active = CustomBooleanField(default=True)

    permission_prefix = "shop:pricingrule"

    class Meta(BaseModel.Meta):
        db_table = "shop_pricing_rules"
        ordering = ["-priority", "-created_at"]
        verbose_name = "Pricing Rule"
        verbose_name_plural = "Pricing Rules"

    def __str__(self):
        return f"Rule: {self.name} ({self.variant.sku} Qty >={self.min_quantity})"
