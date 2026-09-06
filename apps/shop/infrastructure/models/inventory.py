from django.db import models, transaction
from django.core.exceptions import ValidationError
from django.utils import timezone
from core.base_models.validator_model import BaseModel
from core.base_models.scoping_models import BranchModelMixin
from core.base_models.fields.short_ui_fields import CustomShortUUIDField
from core.base_models.fields.char_fields import CustomCharField, CustomTextField
from core.base_models.fields.numeric_fields import CustomIntegerField
from core.base_models.validators.rules import RequiredRule, MinRule, UniqueRule


class Batch(BaseModel):
    """
    Batch & Lot Tracking for Expiry and Perishable Goods.
    """
    id = CustomShortUUIDField(primary_key=True, prefix="btc_")
    batch_number = CustomCharField(
        max_length=60,
        rules=[RequiredRule("batch_number"), UniqueRule("batch_number")],
    )
    variant = models.ForeignKey(
        "shop.ProductVariant",
        on_delete=models.CASCADE,
        related_name="batches",
    )
    manufacturing_date = models.DateField(null=True, blank=True)
    expiry_date = models.DateField(null=True, blank=True)
    supplier = models.ForeignKey(
        "procurement_pos.Supplier",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    class Meta(BaseModel.Meta):
        db_table = "shop_inventory_batches"
        ordering = ["expiry_date", "batch_number"]
        verbose_name = "Inventory Batch"
        verbose_name_plural = "Inventory Batches"

    def __str__(self):
        return f"Batch #{self.batch_number} ({self.variant.sku})"

    @property
    def is_expired(self) -> bool:
        if self.expiry_date:
            return timezone.now().date() > self.expiry_date
        return False


from apps.shop.valuesets import SERIAL_STATUS_VALUESET, STOCK_TRANSFER_STATUS_VALUESET


class SerialNumber(BaseModel):
    """
    Individual Serial Number Tracking for High-Value Products & Warranties.
    """

    id = CustomShortUUIDField(primary_key=True, prefix="sno_")
    serial_number = CustomCharField(
        max_length=80,
        blank=True,
        default="",
        rules=[UniqueRule("serial_number")],
    )
    variant = models.ForeignKey(
        "shop.ProductVariant",
        on_delete=models.CASCADE,
        related_name="serial_numbers",
    )
    warehouse = models.ForeignKey(
        "shop.Warehouse",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    batch = models.ForeignKey(
        Batch,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="serials",
    )
    status = models.CharField(
        max_length=20,
        choices=SERIAL_STATUS_VALUESET.as_django_choices(),
        default="IN_STOCK",
    )

    class Meta(BaseModel.Meta):
        db_table = "shop_inventory_serial_numbers"
        ordering = ["serial_number"]
        verbose_name = "Serial Number"
        verbose_name_plural = "Serial Numbers"

    def __str__(self):
        return f"Serial #{self.serial_number} ({self.variant.sku})"


class Inventory(BaseModel, BranchModelMixin):
    id = CustomShortUUIDField(primary_key=True, prefix="inv_")

    variant = models.ForeignKey(
        "shop.ProductVariant",
        on_delete=models.CASCADE,
        related_name="inventory_records",
        null=True,
        blank=True,
    )
    product = models.ForeignKey(
        "shop.Product",
        on_delete=models.CASCADE,
        related_name="legacy_inventory_records",
        null=True,
        blank=True,
    )
    warehouse = models.ForeignKey(
        "shop.Warehouse",
        on_delete=models.CASCADE,
        related_name="inventory_records",
        null=True,
        blank=True,
    )
    batch = models.ForeignKey(
        Batch,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
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
    unit_cost = models.DecimalField(
        max_digits=18,
        decimal_places=4,
        default=0.0,
        help_text="Stock unit valuation cost",
    )
    valuation_currency = models.ForeignKey(
        "accounting.Currency",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="inventory_records",
        help_text="Inventory valuation cost currency",
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
        unique_together = ["variant", "warehouse", "branch", "batch"]

    def __str__(self):
        target = self.variant.sku if self.variant else (self.product.name if self.product else "Unknown")
        return f"Inventory ({target}): Qty {self.quantity}, Reserved {self.reserved_quantity}"

    @property
    def available_quantity(self):
        return self.quantity - self.reserved_quantity

    @property
    def is_low_stock(self):
        return self.available_quantity <= self.reorder_point

    @classmethod
    @transaction.atomic
    def reserve_stock(cls, inventory_id: str, qty: int) -> bool:
        if qty <= 0:
            raise ValidationError("Reservation quantity must be positive")

        updated_count = cls.objects.filter(
            id=inventory_id,
            quantity__gte=models.F("reserved_quantity") + qty
        ).update(
            reserved_quantity=models.F("reserved_quantity") + qty
        )

        if updated_count == 0:
            raise ValidationError(f"Insufficient stock for inventory {inventory_id}. Failed to reserve {qty} units.")

        return True

    @classmethod
    @transaction.atomic
    def release_stock(cls, inventory_id: str, qty: int) -> bool:
        if qty <= 0:
            return False

        cls.objects.filter(
            id=inventory_id,
            reserved_quantity__gte=qty
        ).update(
            reserved_quantity=models.F("reserved_quantity") - qty
        )
        return True

    @classmethod
    @transaction.atomic
    def commit_stock(cls, inventory_id: str, qty: int) -> bool:
        if qty <= 0:
            return False

        cls.objects.filter(
            id=inventory_id,
            quantity__gte=qty,
            reserved_quantity__gte=qty
        ).update(
            quantity=models.F("quantity") - qty,
            reserved_quantity=models.F("reserved_quantity") - qty
        )
        return True


class StockTransfer(BaseModel):
    """
    Inter-Warehouse Stock Transfer.
    Moves stock between source and target warehouses.
    """

    class TransferStatus:
        DRAFT = STOCK_TRANSFER_STATUS_VALUESET.get("DRAFT").code
        IN_TRANSIT = STOCK_TRANSFER_STATUS_VALUESET.get("IN_TRANSIT").code
        COMPLETED = STOCK_TRANSFER_STATUS_VALUESET.get("COMPLETED").code
        CANCELLED = STOCK_TRANSFER_STATUS_VALUESET.get("CANCELLED").code

    id = CustomShortUUIDField(primary_key=True, prefix="stf_")
    transfer_number = CustomCharField(
        max_length=60,
        blank=True,
        default="",
        rules=[UniqueRule("transfer_number")],
    )
    from_warehouse = models.ForeignKey(
        "shop.Warehouse",
        on_delete=models.PROTECT,
        related_name="outgoing_transfers",
    )
    to_warehouse = models.ForeignKey(
        "shop.Warehouse",
        on_delete=models.PROTECT,
        related_name="incoming_transfers",
    )
    status = models.CharField(
        max_length=20,
        choices=STOCK_TRANSFER_STATUS_VALUESET.as_django_choices(),
        default="DRAFT",
    )
    notes = CustomTextField(nullable=True)

    class Meta(BaseModel.Meta):
        db_table = "shop_stock_transfers"
        ordering = ["-created_at"]
        verbose_name = "Stock Transfer"
        verbose_name_plural = "Stock Transfers"

    def __str__(self):
        return f"Transfer #{self.transfer_number}: {self.from_warehouse.name} -> {self.to_warehouse.name}"
