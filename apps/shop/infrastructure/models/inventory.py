from django.db import models
from core.base_models.validator_model import BaseModel
from core.base_models.scoping_models import BranchModelMixin
from core.base_models.fields.short_ui_fields import CustomShortUUIDField
from core.base_models.fields.numeric_fields import CustomIntegerField
from core.base_models.validators.rules import RequiredRule, MinRule


class Inventory(BaseModel, BranchModelMixin):
    id = CustomShortUUIDField(primary_key=True, prefix="inv_")

    product = models.ForeignKey(
        "shop.Product",
        on_delete=models.CASCADE,
        related_name="inventory_records",
    )
    quantity = CustomIntegerField(
        default=0,
        rules=[RequiredRule("quantity"), MinRule("quantity", 0)],
    )
    reserved_quantity = CustomIntegerField(
        default=0,
        rules=[MinRule("reserved_quantity", 0)],
    )
    reorder_point = CustomIntegerField(
        default=10,
        rules=[MinRule("reorder_point", 0)],
    )

    permission_prefix = "shop:inventory"
    permission_map = {
        "list": "view",
        "retrieve": "view",
        "create": "create",
        "update": "edit",
        "destroy": "delete",
    }

    class Meta(BaseModel.Meta):
        db_table = "shop_inventory"
        ordering = ["-created_at"]
        verbose_name = "Inventory"
        verbose_name_plural = "Inventory Records"
        unique_together = ["product", "branch"]

    def __str__(self):
        return f"Inventory: {self.product.name} ({self.quantity})"

    @property
    def available_quantity(self):
        return self.quantity - self.reserved_quantity

    @property
    def is_low_stock(self):
        return self.available_quantity <= self.reorder_point
