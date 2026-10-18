import hmac
import hashlib
import json
import logging
import urllib.request
import urllib.parse
import base64
from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from core.base_models.system_models import SystemConfig
from apps.payments.models import PaymentTransaction, PaymentGatewayConfig, PaymentRefund

logger = logging.getLogger(__name__)


from apps.payments.adapters.razorpay_adapter import RazorpayPaymentAdapter

# Backward compatibility alias pointing to official adapter
RazorpayPaymentGateway = RazorpayPaymentAdapter


from apps.payments.adapters.factory import PaymentGatewayAdapterFactory
from apps.payments.adapters.paypal_adapter import PayPalPaymentAdapter

# Backward compatibility alias pointing to official adapter
PayPalPaymentGateway = PayPalPaymentAdapter


logger = logging.getLogger(__name__)


class PaymentOrchestrationService:
    """
    Unified Payment Gateway Orchestration Service.
    Leverages PaymentGatewayAdapterFactory and IPaymentGatewayAdapter interface to process
    orders across Razorpay, PayPal, Stripe, and Cash on Delivery (COD).
    """

    @classmethod
    @transaction.atomic
    def initiate_payment(cls, customer_id: str, amount: Decimal, currency: str, gateway_type: str, order_id: str | None = None) -> PaymentTransaction:
        """
        Initiates a new payment transaction via the appropriate gateway adapter.
        """
        gateway_clean = gateway_type.strip().upper()

        # Operational circuit breaker check
        from apps.payments.health.circuit_breaker import GatewayCircuitBreaker
        if not GatewayCircuitBreaker.can_execute(gateway_clean):
            raise ValueError(
                f"Payment gateway '{gateway_clean}' is temporarily unavailable due to upstream provider outages. Please retry shortly."
            )

        adapter = PaymentGatewayAdapterFactory.get_adapter(gateway_clean)
        tx_code = f"TX-{timezone.now().strftime('%Y%m%d%H%M%S')}-{customer_id[:4].upper()}"

        tx = PaymentTransaction.objects.create(
            transaction_code=tx_code,
            customer_id=customer_id,
            order_id=order_id,
            gateway_type=gateway_clean,
            amount=amount,
            currency=currency,
            status="INITIATED",
        )

        try:
            order_res = adapter.create_order(amount, currency, tx.transaction_code)
            GatewayCircuitBreaker.record_success(gateway_clean)
        except Exception as exc:
            GatewayCircuitBreaker.record_failure(gateway_clean)
            raise exc

        tx.gateway_order_id = order_res.gateway_order_id
        tx.gateway_response = order_res.raw_response
        tx.status = "AUTHORIZED" if gateway_clean == "COD" else "PENDING"
        tx.save()

        return tx

    @classmethod
    @transaction.atomic
    def verify_and_capture_razorpay(cls, transaction_id: str, razorpay_payment_id: str, razorpay_signature: str) -> PaymentTransaction:
        """
        Verifies Razorpay signature using RazorpayPaymentAdapter and captures payment.
        """
        tx = PaymentTransaction.objects.get(id=transaction_id)
        adapter = PaymentGatewayAdapterFactory.get_adapter(tx.gateway_type)

        verify_res = adapter.verify_payment({
            "razorpay_order_id": tx.gateway_order_id,
            "razorpay_payment_id": razorpay_payment_id,
            "razorpay_signature": razorpay_signature,
        })

        if not verify_res.is_valid:
            tx.status = "FAILED"
            tx.failure_reason = verify_res.error_message or "HMAC Verification Failed"
            tx.save()
            raise ValueError(f"Invalid Razorpay payment signature: {verify_res.error_message}")

        capture_res = adapter.capture_payment(razorpay_payment_id, tx.amount)

        tx.gateway_payment_id = capture_res.gateway_payment_id
        tx.gateway_signature = razorpay_signature
        tx.status = "CAPTURED" if capture_res.is_success else "FAILED"
        tx.save()

        if tx.order and capture_res.is_success:
            tx.order.status = "confirmed"
            tx.order.save(update_fields=["status"])

        logger.info(f"Successfully captured Razorpay payment transaction {tx.transaction_code}")
        return tx

    @classmethod
    @transaction.atomic
    def capture_paypal_payment(cls, transaction_id: str, paypal_order_id: str) -> PaymentTransaction:
        """
        Captures approved PayPal payment transaction via PayPalPaymentAdapter.
        """
        tx = PaymentTransaction.objects.get(id=transaction_id)
        adapter = PaymentGatewayAdapterFactory.get_adapter(tx.gateway_type)

        capture_res = adapter.capture_payment(paypal_order_id, tx.amount)

        tx.gateway_payment_id = capture_res.gateway_payment_id
        tx.gateway_response = capture_res.raw_response
        tx.status = "CAPTURED" if capture_res.is_success else "FAILED"
        tx.save()

        if tx.order and capture_res.is_success:
            tx.order.status = "confirmed"
            tx.order.save(update_fields=["status"])

        logger.info(f"Successfully captured PayPal payment transaction {tx.transaction_code}")
        return tx
