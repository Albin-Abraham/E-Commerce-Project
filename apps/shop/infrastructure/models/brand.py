from django.db import models
from core.base_models.validator_model import BaseModel
from core.base_models.fields.short_ui_fields import CustomShortUUIDField
from core.base_models.fields.char_fields import CustomCharField, CustomTextField
from core.base_models.validators.rules import RequiredRule, UniqueRule


class Brand(BaseModel):
    id = CustomShortUUIDField(primary_key=True, prefix="brd_")
    name = CustomCharField(
        max_length=150,
        rules=[RequiredRule("name"), UniqueRule("name")],
    )
    slug = CustomCharField(
        max_length=150,
        rules=[RequiredRule("slug"), UniqueRule("slug")],
    )
    description = CustomTextField(nullable=True)
    website = models.URLField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    metadata = models.JSONField(default=dict, blank=True)

    permission_prefix = "shop:brand"
    permission_map = {
        "list": "view",
        "retrieve": "view",
        "create": "create",
        "update": "edit",
        "destroy": "delete",
    }

    class Meta(BaseModel.Meta):
        db_table = "shop_brands"
        ordering = ["name"]
        verbose_name = "Brand"
        verbose_name_plural = "Brands"

    def __str__(self):
        return self.name
