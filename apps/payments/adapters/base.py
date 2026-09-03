from abc import ABC, abstractmethod
from dataclasses import dataclass
from decimal import Decimal
from typing import Any


@dataclass
class PaymentOrderResult:
    gateway_order_id: str
    amount: Decimal
    currency: str
    status: str
    raw_response: dict[str, Any]
    approval_url: str | None = None


@dataclass
class PaymentVerificationResult:
    is_valid: bool
    gateway_payment_id: str | None = None
    gateway_signature: str | None = None
    error_message: str | None = None


@dataclass
class PaymentCaptureResult:
    is_success: bool
    gateway_payment_id: str
    amount: Decimal
    status: str
    raw_response: dict[str, Any]


@dataclass
class PaymentRefundResult:
    is_success: bool
    gateway_refund_id: str
    amount: Decimal
    raw_response: dict[str, Any]


class IPaymentGatewayAdapter(ABC):
    """
    Abstract Payment Gateway Adapter Interface.
    Enforces unified API contract for Razorpay, PayPal, Stripe, and COD payment providers.
    """

    @abstractmethod
    def create_order(self, amount: Decimal, currency: str, reference_id: str, **kwargs) -> PaymentOrderResult:
        """Creates a payment order with the gateway."""
        pass

    @abstractmethod
    def verify_payment(self, payload: dict) -> PaymentVerificationResult:
        """Verifies payment signature / authentication token."""
        pass

    @abstractmethod
    def capture_payment(self, payment_id: str, amount: Decimal) -> PaymentCaptureResult:
        """Captures authorized payment funds."""
        pass

    @abstractmethod
    def refund_payment(self, payment_id: str, amount: Decimal, reason: str = "") -> PaymentRefundResult:
        """Processes partial or full refund."""
        pass
