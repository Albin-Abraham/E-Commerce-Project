from django.db import models
from core.base_models.validator_model import BaseModel
from core.base_models.fields.short_ui_fields import CustomShortUUIDField
from core.base_models.fields.char_fields import CustomCharField, CustomTextField
from core.base_models.validators.rules import RequiredRule, UniqueRule


class Warehouse(BaseModel):
    id = CustomShortUUIDField(primary_key=True, prefix="wh_")
    name = CustomCharField(
        max_length=150,
        rules=[RequiredRule("name"), UniqueRule("name")],
    )
    code = CustomCharField(
        max_length=50,
        rules=[RequiredRule("code"), UniqueRule("code")],
    )
    address = CustomTextField(nullable=True)
    is_active = models.BooleanField(default=True)
    company = models.ForeignKey(
        "core_admin.Company",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="warehouses",
    )

    permission_prefix = "shop:warehouse"
    permission_map = {
        "list": "view",
        "retrieve": "view",
        "create": "create",
        "update": "edit",
        "destroy": "delete",
    }

    class Meta(BaseModel.Meta):
        db_table = "shop_warehouses"
        ordering = ["name"]
        verbose_name = "Warehouse"
        verbose_name_plural = "Warehouses"

    def __str__(self):
        return f"{self.name} ({self.code})"
