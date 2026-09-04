import logging
from django.db import models
from django.conf import settings
from core.base_models.validator_model import BaseModel
from core.base_models.fields.short_ui_fields import CustomShortUUIDField
from core.base_models.fields.char_fields import CustomCharField
from core.base_models.fields.numeric_fields import CustomDecimalField
from shared_domain.base.valuesets import ValueSet, ValueSetItem

logger = logging.getLogger(__name__)

PAYMENT_GATEWAY_VALUESET = ValueSet(
    name="payment_gateway_type",
    domain="payments",
    items=[
        ValueSetItem("RAZORPAY", "Razorpay Payment Gateway"),
        ValueSetItem("PAYPAL", "PayPal Express Checkout"),
        ValueSetItem("STRIPE", "Stripe Credit Card Gateway"),
        ValueSetItem("COD", "Cash on Delivery"),
    ],
)

PAYMENT_STATUS_VALUESET = ValueSet(
    name="payment_transaction_status",
    domain="payments",
    items=[
        ValueSetItem("INITIATED", "Payment Initiated"),
        ValueSetItem("PENDING", "Pending Customer Action"),
        ValueSetItem("AUTHORIZED", "Payment Authorized"),
        ValueSetItem("CAPTURED", "Payment Successfully Captured"),
        ValueSetItem("FAILED", "Payment Failed"),
        ValueSetItem("CANCELLED", "Payment Cancelled"),
        ValueSetItem("REFUNDED", "Payment Fully Refunded"),
        ValueSetItem("PARTIALLY_REFUNDED", "Payment Partially Refunded"),
    ],
)


class PaymentGatewayConfig(BaseModel):
    """
    Stores gateway configuration metadata for Razorpay, PayPal, Stripe, and COD.
    """
    GATEWAY_CHOICES = PAYMENT_GATEWAY_VALUESET.as_django_choices()

    gateway_type = CustomCharField(max_length=30, choices=PAYMENT_GATEWAY_VALUESET.as_django_choices(), unique=True)
    display_name = CustomCharField(max_length=100)
    is_active = models.BooleanField(default=True)
    is_sandbox = models.BooleanField(default=True)
    merchant_id = models.CharField(max_length=255, blank=True, null=True)
    supported_currencies = models.JSONField(default=list, blank=True)
    extra_config = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "payment_gateway_configs"
        verbose_name = "Payment Gateway Config"
        verbose_name_plural = "Payment Gateway Configs"

    def __str__(self):
        return f"{self.display_name} ({'Sandbox' if self.is_sandbox else 'Live'})"


class PaymentTransaction(BaseModel):
    """
    Tracks all payment attempts, authorizations, captures, and status transitions across Razorpay & PayPal.
    """
    STATUS_CHOICES = PAYMENT_STATUS_VALUESET.as_django_choices()

    id = CustomShortUUIDField(prefix="tx_", primary_key=True)
    transaction_code = CustomCharField(max_length=60, unique=True)
    customer = models.ForeignKey("customers.Customer", on_delete=models.CASCADE, related_name="payment_transactions")
    order = models.ForeignKey("shop.Order", on_delete=models.CASCADE, related_name="transactions", null=True, blank=True)

    gateway_type = models.CharField(max_length=30, choices=PAYMENT_GATEWAY_VALUESET.as_django_choices())
    gateway_order_id = models.CharField(max_length=255, blank=True, null=True, db_index=True)
    gateway_payment_id = models.CharField(max_length=255, blank=True, null=True, db_index=True)
    gateway_signature = models.CharField(max_length=500, blank=True, null=True)
    amount = CustomDecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=10, default="USD")
    status = models.CharField(max_length=30, choices=PAYMENT_STATUS_VALUESET.as_django_choices(), default="INITIATED", db_index=True)
    failure_reason = models.TextField(blank=True, null=True)
    gateway_response = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "payment_transactions"
        verbose_name = "Payment Transaction"
        verbose_name_plural = "Payment Transactions"
        ordering = ["-created_at"]

    def __str__(self):
        return f"[{self.gateway_type}] {self.transaction_code} - ${self.amount} ({self.status})"


class PaymentRefund(BaseModel):
    """
    Tracks partial and full refunds issued through Razorpay or PayPal.
    """
    id = CustomShortUUIDField(prefix="rfnd_", primary_key=True)
    transaction = models.ForeignKey(PaymentTransaction, on_delete=models.CASCADE, related_name="refunds")
    gateway_refund_id = models.CharField(max_length=255, blank=True, null=True)
    amount = CustomDecimalField(max_digits=12, decimal_places=2)
    reason = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=30, default="PROCESSED")
    gateway_response = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "payment_refunds"
        verbose_name = "Payment Refund"
        verbose_name_plural = "Payment Refunds"
        ordering = ["-created_at"]
