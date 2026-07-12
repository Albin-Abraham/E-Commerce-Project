from django.db import models
from core.base_models.validator_model import BaseModel
from core.base_models.fields.short_ui_fields import CustomShortUUIDField
from core.base_models.fields.char_fields import CustomCharField, CustomTextField
from core.base_models.validators.rules import RequiredRule, UniqueRule, MinRule


class Category(BaseModel):
    id = CustomShortUUIDField(primary_key=True, prefix="cat_")

    name = CustomCharField(
        max_length=100,
        rules=[
            RequiredRule("name"),
            MinRule("name", 2),
        ],
    )
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="children",
    )
    description = CustomTextField(nullable=True)

    permission_prefix = "shop:category"
    permission_map = {
        "list": "view",
        "retrieve": "view",
        "create": "create",
        "update": "edit",
        "destroy": "delete",
    }

    class Meta(BaseModel.Meta):
        db_table = "shop_categories"
        ordering = ["name"]
        verbose_name = "Category"
        verbose_name_plural = "Categories"

    def __str__(self):
        return self.name
