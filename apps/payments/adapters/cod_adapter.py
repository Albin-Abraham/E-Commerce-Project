from decimal import Decimal
from typing import TYPE_CHECKING

from apps.payments.adapters.base import (
    IPaymentGatewayAdapter,
    PaymentCaptureResult,
    PaymentOrderResult,
    PaymentRefundResult,
    PaymentVerificationResult,
)

if TYPE_CHECKING:
    from apps.payments.configuration.schemas import ResolvedPaymentGatewayConfig


class CODPaymentAdapter(IPaymentGatewayAdapter):
    """
    Cash on Delivery (COD) Adapter implementing IPaymentGatewayAdapter.
    """

    def __init__(self, config: "ResolvedPaymentGatewayConfig | None" = None):
        if config is None:
            from apps.payments.configuration.resolver import PaymentGatewayConfigResolver

            config = PaymentGatewayConfigResolver.resolve_gateway("COD")
        self.config = config

    def create_order(
        self, amount: Decimal, currency: str, reference_id: str, **kwargs
    ) -> PaymentOrderResult:
        cod_id = f"COD_{reference_id}"
        return PaymentOrderResult(
            gateway_order_id=cod_id,
            amount=amount,
            currency=currency,
            status="AUTHORIZED",
            raw_response={"type": "COD", "id": cod_id},
        )

    def verify_payment(self, payload: dict) -> PaymentVerificationResult:
        return PaymentVerificationResult(
            is_valid=True, gateway_payment_id=payload.get("transaction_id", "COD_PAYMENT")
        )

    def capture_payment(self, payment_id: str, amount: Decimal) -> PaymentCaptureResult:
        return PaymentCaptureResult(
            is_success=True,
            gateway_payment_id=payment_id,
            amount=amount,
            status="CAPTURED",
            raw_response={"type": "COD", "status": "CAPTURED"},
        )

    def refund_payment(
        self, payment_id: str, amount: Decimal, reason: str = ""
    ) -> PaymentRefundResult:
        return PaymentRefundResult(
            is_success=True,
            gateway_refund_id=f"cod_rfnd_{payment_id[:6]}",
            amount=amount,
            raw_response={"type": "COD", "status": "REFUNDED"},
        )
