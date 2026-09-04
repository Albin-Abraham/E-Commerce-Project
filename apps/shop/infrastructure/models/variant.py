from django.db import models
from core.base_models.validator_model import BaseModel
from core.base_models.fields.short_ui_fields import CustomShortUUIDField
from core.base_models.fields.char_fields import CustomCharField
from core.base_models.fields.numeric_fields import CustomDecimalField
from core.base_models.validators.rules import RequiredRule, UniqueRule, MinRule


from apps.shop.valuesets import VARIANT_STATUS_VALUESET


class ProductVariant(BaseModel):
    id = CustomShortUUIDField(primary_key=True, prefix="var_")
    product = models.ForeignKey(
        "shop.Product",
        on_delete=models.CASCADE,
        related_name="variants",
    )
    sku = CustomCharField(
        max_length=60,
        blank=True,
        default="",
        rules=[UniqueRule("sku")],
    )
    price = CustomDecimalField(
        max_digits=12,
        decimal_places=2,
        rules=[RequiredRule("price"), MinRule("price", 0)],
    )
    compare_at_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Original or comparison price for promotional discounts",
    )
    barcode = models.CharField(max_length=100, blank=True, null=True)
    status = models.CharField(
        max_length=20,
        choices=VARIANT_STATUS_VALUESET.as_django_choices(),
        default="ACTIVE",
    )
    attributes = models.JSONField(
        default=dict,
        blank=True,
        help_text="Variant specific options, e.g. {'color': 'Black', 'size': 'XL'}",
    )
    is_active = models.BooleanField(default=True)

    permission_prefix = "shop:variant"
    permission_map = {
        "list": "view",
        "retrieve": "view",
        "create": "create",
        "update": "edit",
        "destroy": "delete",
    }

    class Meta(BaseModel.Meta):
        db_table = "shop_product_variants"
        ordering = ["product", "sku"]
        verbose_name = "Product Variant"
        verbose_name_plural = "Product Variants"

    def __str__(self):
        return f"{self.product.name} - Variant ({self.sku})"
