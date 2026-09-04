from django.db import models, transaction
from django.utils import timezone
from core.base_models.validator_model import BaseModel
from core.base_models.constants import USER_MODEL
from core.base_models.fields.short_ui_fields import CustomShortUUIDField
from core.base_models.fields.char_fields import CustomCharField
from core.base_models.validators.rules import RequiredRule, UniqueRule


class POSRegister(BaseModel):
    """
    Physical POS Register terminal (e.g. Counter 1, Checkout Terminal A).
    """
    id = CustomShortUUIDField(primary_key=True, prefix="reg_")
    name = CustomCharField(
        max_length=100,
        rules=[RequiredRule("name")],
    )
    code = CustomCharField(
        max_length=50,
        rules=[RequiredRule("code"), UniqueRule("code")],
    )
    warehouse = models.ForeignKey(
        "shop.Warehouse",
        on_delete=models.CASCADE,
        related_name="pos_registers",
    )
    branch = models.ForeignKey(
        "core_admin.Branch",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    is_active = models.BooleanField(default=True)

    permission_prefix = "pos:register"

    class Meta(BaseModel.Meta):
        db_table = "pos_registers"
        ordering = ["name"]
        verbose_name = "POS Register"
        verbose_name_plural = "POS Registers"

    def __str__(self):
        return f"{self.name} ({self.code})"


from apps.procurement_pos.valuesets import (
    PAYMENT_METHOD_VALUESET,
    POS_SESSION_STATUS_VALUESET,
    POS_TRANSACTION_STATUS_VALUESET,
)


class POSSession(BaseModel):
    """
    Cashier Shift / POS Session.
    Tracks opening cash, closing reconciliation, and sales performance per shift.
    """

    id = CustomShortUUIDField(primary_key=True, prefix="ses_")
    register = models.ForeignKey(
        POSRegister,
        on_delete=models.CASCADE,
        related_name="sessions",
    )
    cashier = models.ForeignKey(
        USER_MODEL,
        on_delete=models.CASCADE,
        related_name="pos_sessions",
    )
    opened_at = models.DateTimeField(default=timezone.now)
    closed_at = models.DateTimeField(null=True, blank=True)
    opening_balance = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    closing_balance = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    total_sales = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    status = models.CharField(
        max_length=20,
        choices=POS_SESSION_STATUS_VALUESET.as_django_choices(),
        default="OPEN",
    )

    permission_prefix = "pos:session"

    class Meta(BaseModel.Meta):
        db_table = "pos_sessions"
        ordering = ["-opened_at"]
        verbose_name = "POS Session"
        verbose_name_plural = "POS Sessions"

    def __str__(self):
        return f"Session #{self.id} on {self.register.name} by {self.cashier.username}"


class POSTransaction(BaseModel):
    """
    POS Checkout Transaction.
    Instantly processes stock deduction via atomic Inventory commit.
    """

    id = CustomShortUUIDField(primary_key=True, prefix="trx_")
    session = models.ForeignKey(
        POSSession,
        on_delete=models.CASCADE,
        related_name="transactions",
    )
    transaction_number = CustomCharField(
        max_length=60,
        blank=True,
        default="",
        rules=[UniqueRule("transaction_number")],
    )
    customer = models.ForeignKey(
        USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    payment_method = models.CharField(
        max_length=30,
        choices=PAYMENT_METHOD_VALUESET.as_django_choices(),
        default="CASH",
    )
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    status = models.CharField(
        max_length=20,
        choices=POS_TRANSACTION_STATUS_VALUESET.as_django_choices(),
        default="COMPLETED",
    )

    class Meta(BaseModel.Meta):
        db_table = "pos_transactions"
        ordering = ["-created_at"]
        verbose_name = "POS Transaction"
        verbose_name_plural = "POS Transactions"

    def __str__(self):
        return f"Trx #{self.transaction_number} (${self.total_amount})"


class POSTransactionItem(BaseModel):
    id = CustomShortUUIDField(primary_key=True, prefix="txi_")
    transaction = models.ForeignKey(
        POSTransaction,
        on_delete=models.CASCADE,
        related_name="items",
    )
    variant = models.ForeignKey(
        "shop.ProductVariant",
        on_delete=models.PROTECT,
    )
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    total_price = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta(BaseModel.Meta):
        db_table = "pos_transaction_items"

    def _override_pre_save(self, is_creating: bool):
        self.total_price = (self.quantity * self.unit_price) - self.discount

