from django.db import models
from core.base_models.validator_model import BaseModel
from core.base_models.scoping_models import TenantModelMixin
from core.base_models.fields.short_ui_fields import CustomShortUUIDField
from core.base_models.fields.char_fields import CustomCharField, CustomTextField
from core.base_models.fields.numeric_fields import CustomDecimalField
from core.base_models.fields.boolean_fields import CustomBooleanField
from core.base_models.validators.rules import RequiredRule, UniqueRule, MinRule


class Product(BaseModel, TenantModelMixin):
    id = CustomShortUUIDField(primary_key=True, prefix="prod_")

    name = CustomCharField(
        max_length=200,
        rules=[
            RequiredRule("name"),
            MinRule("name", 2),
        ],
    )
    sku = CustomCharField(
        max_length=50,
        rules=[
            RequiredRule("sku"),
            UniqueRule("sku"),
        ],
    )
    description = CustomTextField(nullable=True)
    category = models.ForeignKey(
        "shop.Category",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="products",
    )
    price = CustomDecimalField(
        max_digits=10,
        decimal_places=2,
        rules=[RequiredRule("price"), MinRule("price", 0)],
    )
    is_active = CustomBooleanField(default=True)

    permission_prefix = "shop:product"
    permission_map = {
        "list": "view",
        "retrieve": "view",
        "create": "create",
        "update": "edit",
        "destroy": "delete",
    }

    class Meta(BaseModel.Meta):
        db_table = "shop_products"
        ordering = ["name"]
        verbose_name = "Product"
        verbose_name_plural = "Products"

    def __str__(self):
        return self.name
