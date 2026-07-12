from django.db import models
from core.base_models.validator_model import BaseModel
from core.base_models.fields.short_ui_fields import CustomShortUUIDField
from core.base_models.fields.numeric_fields import CustomDecimalField, CustomIntegerField
from core.base_models.validators.rules import RequiredRule, MinRule


class OrderItem(BaseModel):
    id = CustomShortUUIDField(primary_key=True, prefix="ori_")

    order = models.ForeignKey(
        "shop.Order",
        on_delete=models.CASCADE,
        related_name="items",
    )
    product = models.ForeignKey(
        "shop.Product",
        on_delete=models.CASCADE,
        related_name="order_items",
    )
    quantity = CustomIntegerField(
        rules=[RequiredRule("quantity"), MinRule("quantity", 1)],
    )
    unit_price = CustomDecimalField(
        max_digits=10,
        decimal_places=2,
        rules=[RequiredRule("unit_price"), MinRule("unit_price", 0)],
    )
    line_total = CustomDecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
    )

    class Meta(BaseModel.Meta):
        db_table = "shop_order_items"
        ordering = ["created_at"]
        verbose_name = "Order Item"
        verbose_name_plural = "Order Items"

    def __str__(self):
        return f"{self.product.name} x{self.quantity}"

    def _override_pre_save(self, is_creating):
        self.line_total = self.quantity * self.unit_price
