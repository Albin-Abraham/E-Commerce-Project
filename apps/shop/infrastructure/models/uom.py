from django.db import models
from core.base_models.validator_model import BaseModel
from core.base_models.scoping_models import TenantModelMixin
from core.base_models.fields.short_ui_fields import CustomShortUUIDField
from core.base_models.fields.char_fields import CustomCharField
from core.base_models.fields.numeric_fields import CustomDecimalField
from core.base_models.fields.boolean_fields import CustomBooleanField
from core.base_models.validators.rules import RequiredRule, UniqueRule, MinRule


class UOM(BaseModel, TenantModelMixin):
    """
    Master Unit of Measure (UOM) entity.
    Defines baseline reusable business units (e.g. PCS, KG, BOX, LITRE, HOUR, DAY).
    """

    UOM_TYPE_CHOICES = [
        ("COUNT", "Unit Count"),
        ("WEIGHT", "Weight"),
        ("VOLUME", "Volume"),
        ("LENGTH", "Length"),
        ("TIME", "Time / Duration"),
        ("AREA", "Surface Area"),
    ]

    id = CustomShortUUIDField(primary_key=True, prefix="uom_")
    code = CustomCharField(
        max_length=30,
        rules=[RequiredRule("code"), UniqueRule("code")],
        help_text="Unique unit symbol/code (e.g. PCS, KG, BOX)",
    )
    name = CustomCharField(
        max_length=100,
        rules=[RequiredRule("name")],
        help_text="Full unit name (e.g. Pieces, Kilograms, Box)",
    )
    uom_type = models.CharField(
        max_length=20,
        choices=UOM_TYPE_CHOICES,
        default="COUNT",
    )
    is_active = CustomBooleanField(default=True)

    permission_prefix = "shop:uom"

    class Meta(BaseModel.Meta):
        db_table = "shop_uom"
        ordering = ["code"]
        verbose_name = "Unit of Measure"
        verbose_name_plural = "Units of Measure"

    def __str__(self):
        return f"{self.name} ({self.code})"


class UOMConversion(BaseModel, TenantModelMixin):
    """
    Global UOM Conversion Engine.
    Defines default conversion ratios between units of the same category (e.g., 1 KG = 1000 G, 1 BOX = 10 PCS).
    """

    id = CustomShortUUIDField(primary_key=True, prefix="uomc_")
    from_uom = models.ForeignKey(
        UOM,
        on_delete=models.CASCADE,
        related_name="outgoing_conversions",
    )
    to_uom = models.ForeignKey(
        UOM,
        on_delete=models.CASCADE,
        related_name="incoming_conversions",
    )
    conversion_factor = CustomDecimalField(
        max_digits=18,
        decimal_places=6,
        rules=[RequiredRule("conversion_factor"), MinRule("conversion_factor", 0.000001)],
        help_text="Multiplier: value in from_uom * conversion_factor = value in to_uom",
    )

    class Meta(BaseModel.Meta):
        db_table = "shop_uom_conversions"
        unique_together = ("from_uom", "to_uom")
        verbose_name = "UOM Conversion"
        verbose_name_plural = "UOM Conversions"

    def __str__(self):
        return f"1 {self.from_uom.code} = {self.conversion_factor} {self.to_uom.code}"


class ItemUOM(BaseModel, TenantModelMixin):
    """
    Item-Specific Unit of Measure Overrides.
    Supports product-specific packaging and conversion ratios (e.g. 1 CASE of Coca-Cola = 24 PCS).
    """

    id = CustomShortUUIDField(primary_key=True, prefix="iuom_")
    variant = models.ForeignKey(
        "shop.ProductVariant",
        on_delete=models.CASCADE,
        related_name="item_uoms",
    )
    uom = models.ForeignKey(
        UOM,
        on_delete=models.CASCADE,
        related_name="item_usages",
    )
    conversion_factor = CustomDecimalField(
        max_digits=18,
        decimal_places=6,
        rules=[RequiredRule("conversion_factor"), MinRule("conversion_factor", 0.000001)],
        help_text="Ratio to baseline stock UOM of this item",
    )
    is_stock_uom = CustomBooleanField(default=False)
    is_sales_uom = CustomBooleanField(default=True)
    is_purchase_uom = CustomBooleanField(default=True)

    class Meta(BaseModel.Meta):
        db_table = "shop_item_uoms"
        unique_together = ("variant", "uom")
        verbose_name = "Item UOM"
        verbose_name_plural = "Item UOMs"

    def __str__(self):
        return f"{self.variant.sku} - {self.uom.code} (x{self.conversion_factor})"
