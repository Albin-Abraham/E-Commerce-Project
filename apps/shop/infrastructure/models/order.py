from django.db import models
from core.base_models.validator_model import BaseModel
from core.base_models.scoping_models import BranchModelMixin
from core.base_models.fields.short_ui_fields import CustomShortUUIDField
from core.base_models.fields.char_fields import CustomCharField
from core.base_models.fields.numeric_fields import CustomDecimalField
from core.base_models.validators.rules import RequiredRule


from apps.shop.valuesets import SHOP_ORDER_STATUS_VALUESET


class Order(BaseModel, BranchModelMixin):
    class StatusChoices:
        PENDING = SHOP_ORDER_STATUS_VALUESET.get("pending").code
        CONFIRMED = SHOP_ORDER_STATUS_VALUESET.get("confirmed").code
        SHIPPED = SHOP_ORDER_STATUS_VALUESET.get("shipped").code
        DELIVERED = SHOP_ORDER_STATUS_VALUESET.get("delivered").code
        CANCELLED = SHOP_ORDER_STATUS_VALUESET.get("cancelled").code

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

    _number_series_doc_type = "shop_order"
    _number_series_field = "order_number"

    class Meta(BaseModel.Meta):
        db_table = "shop_orders"
        ordering = ["-created_at"]
        verbose_name = "Order"
        verbose_name_plural = "Orders"

    def __str__(self):
        return f"Order {self.order_number}"
