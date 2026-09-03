from uuid import uuid4
from django.db import models
from core.base_models.validator_model import BaseModel
from core.base_models.scoping_models import BranchModelMixin
from core.base_models.fields.short_ui_fields import CustomShortUUIDField
from core.base_models.fields.char_fields import CustomCharField
from core.base_models.fields.numeric_fields import CustomDecimalField
from core.base_models.validators.rules import RequiredRule


from apps.shop.valuesets import SHOP_ORDER_STATUS_VALUESET


class Order(BaseModel, BranchModelMixin):
    id = CustomShortUUIDField(primary_key=True, prefix="ord_")

    user = models.ForeignKey(
        "users.UserModel",
        on_delete=models.CASCADE,
        related_name="shop_orders",
    )
    order_number = CustomCharField(
        max_length=50,
    )

    status = CustomCharField(
        max_length=20,
        choices=SHOP_ORDER_STATUS_VALUESET.as_django_choices(),
        default="pending",
        rules=[RequiredRule("status")],
    )
    total_amount = CustomDecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
    )

    permission_prefix = "shop:order"
    permission_map = {
        "list": "view",
        "retrieve": "view",
        "create": "create",
        "update": "edit",
        "destroy": "delete",
    }

    def _override_pre_save(self, is_creating):
        if is_creating and not self.order_number:
            self.order_number = f"ORD-{uuid4().hex[:8].upper()}"

    class Meta(BaseModel.Meta):
        db_table = "shop_orders"
        ordering = ["-created_at"]
        verbose_name = "Order"
        verbose_name_plural = "Orders"

    def __str__(self):
        return f"Order {self.order_number}"
