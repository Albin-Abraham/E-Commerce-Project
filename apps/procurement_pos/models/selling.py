from django.db import models, transaction
from django.utils import timezone
from core.base_models.validator_model import BaseModel
from core.base_models.constants import USER_MODEL
from core.base_models.fields.short_ui_fields import CustomShortUUIDField
from core.base_models.fields.char_fields import CustomCharField, CustomTextField
from core.base_models.validators.rules import RequiredRule, UniqueRule


from apps.procurement_pos.valuesets import (
    DELIVERY_STATUS_VALUESET,
    SALES_ORDER_STATUS_VALUESET,
)


class SalesOrder(BaseModel):
    """
    Sales Order / Quotation Confirmation.
    """

    id = CustomShortUUIDField(primary_key=True, prefix="so_")
    order_number = CustomCharField(
        max_length=60,
        rules=[RequiredRule("order_number"), UniqueRule("order_number")],
    )
    customer = models.ForeignKey(
        USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sales_orders",
    )
    status = models.CharField(
        max_length=20,
        choices=SALES_ORDER_STATUS_VALUESET.as_django_choices(),
        default="DRAFT",
    )
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)

    class Meta(BaseModel.Meta):
        db_table = "sales_orders"
        ordering = ["-created_at"]
        verbose_name = "Sales Order"
        verbose_name_plural = "Sales Orders"

    def __str__(self):
        return f"SO #{self.order_number} (${self.total_amount})"


class DeliveryNote(BaseModel):
    """
    Delivery Note / Goods Outward Note.
    Links Sales Order to physical warehouse stock dispatch.
    """

    id = CustomShortUUIDField(primary_key=True, prefix="dn_")
    delivery_number = CustomCharField(
        max_length=60,
        rules=[RequiredRule("delivery_number"), UniqueRule("delivery_number")],
    )
    sales_order = models.ForeignKey(
        SalesOrder,
        on_delete=models.CASCADE,
        related_name="delivery_notes",
    )
    warehouse = models.ForeignKey(
        "shop.Warehouse",
        on_delete=models.PROTECT,
    )
    status = models.CharField(
        max_length=20,
        choices=DELIVERY_STATUS_VALUESET.as_django_choices(),
        default="DRAFT",
    )
    tracking_number = models.CharField(max_length=100, blank=True, null=True)

    class Meta(BaseModel.Meta):
        db_table = "sales_delivery_notes"
        ordering = ["-created_at"]
        verbose_name = "Delivery Note"
        verbose_name_plural = "Delivery Notes"

    def __str__(self):
        return f"Delivery Note #{self.delivery_number} for SO #{self.sales_order.order_number}"
