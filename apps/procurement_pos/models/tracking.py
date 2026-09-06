"""Purchase Order tracking: status timeline events and per-line delivery tracking."""

from django.db import models
from django.utils import timezone
from core.base_models.validator_model import BaseModel
from core.base_models.constants import USER_MODEL
from core.base_models.fields.short_ui_fields import CustomShortUUIDField
from core.base_models.fields.char_fields import CustomCharField
from core.base_models.validators.rules import RequiredRule, UniqueRule
from apps.procurement_pos.valuesets import (
    PO_STATUS_VALUESET,
    TRACKING_STATUS_VALUESET,
)


class PurchaseOrderEvent(BaseModel):
    """
    Timeline / audit log of Purchase Order lifecycle transitions.
    Records who moved the PO and to which status (submit, approve, receive, cancel...).
    """

    id = CustomShortUUIDField(primary_key=True, prefix="poev_")
    purchase_order = models.ForeignKey(
        "procurement_pos.PurchaseOrder",
        on_delete=models.CASCADE,
        related_name="tracking_events",
    )
    status = models.CharField(
        max_length=30,
        choices=PO_STATUS_VALUESET.as_django_choices(),
        help_text="PO status recorded by this event",
    )
    description = models.TextField(blank=True, null=True)
    changed_by = models.ForeignKey(
        USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="po_tracking_events",
    )
    event_at = models.DateTimeField(default=timezone.now)

    class Meta(BaseModel.Meta):
        db_table = "procurement_po_tracking_events"
        ordering = ["created_at"]
        verbose_name = "Purchase Order Tracking Event"
        verbose_name_plural = "Purchase Order Tracking Events"

    def __str__(self):
        return f"PO {self.purchase_order.po_number} -> {self.status}"


class PurchaseOrderLineTracking(BaseModel):
    """
    Delivery / shipment tracking for a single PO line (carrier, tracking no, ETA, arrival).
    Multiple shipments per line are allowed (one tracking row per consignment).
    """

    id = CustomShortUUIDField(primary_key=True, prefix="polt_")
    purchase_order_item = models.ForeignKey(
        "procurement_pos.PurchaseOrderItem",
        on_delete=models.CASCADE,
        related_name="trackings",
    )
    carrier_name = CustomCharField(
        max_length=150,
        rules=[RequiredRule("carrier_name")],
        help_text="Courier / carrier e.g. FedEx, DHL",
    )
    tracking_number = CustomCharField(
        max_length=100,
        rules=[RequiredRule("tracking_number"), UniqueRule("tracking_number")],
        help_text="Carrier tracking number / consignment reference",
    )
    status = models.CharField(
        max_length=20,
        choices=TRACKING_STATUS_VALUESET.as_django_choices(),
        default="PENDING",
    )
    shipped_at = models.DateTimeField(null=True, blank=True)
    expected_delivery_date = models.DateField(null=True, blank=True)
    estimated_delivery_date = models.DateField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)

    class Meta(BaseModel.Meta):
        db_table = "procurement_po_line_trackings"
        ordering = ["-created_at"]
        verbose_name = "Purchase Order Line Tracking"
        verbose_name_plural = "Purchase Order Line Trackings"

    @property
    def is_delivered(self):
        return self.status == "DELIVERED"

    @property
    def is_delayed(self):
        expected = self.expected_delivery_date
        return (
            not self.is_delivered
            and expected is not None
            and timezone.localdate() > expected
        )

    @property
    def line_status(self):
        return self.purchase_order_item.status

    def mark_delivered(self, delivered_at=None):
        self.status = "DELIVERED"
        self.delivered_at = delivered_at or timezone.now()
        self.save(update_fields=["status", "delivered_at", "updated_at"])
        return self