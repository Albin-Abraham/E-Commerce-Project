import logging
from apps.payments.adapters.base import IPaymentGatewayAdapter
from apps.payments.adapters.razorpay_adapter import RazorpayPaymentAdapter
from apps.payments.adapters.paypal_adapter import PayPalPaymentAdapter
from apps.payments.adapters.cod_adapter import CODPaymentAdapter

logger = logging.getLogger(__name__)


class PaymentGatewayAdapterFactory:
    """
    Factory Pattern for dynamic Payment Gateway Adapter resolution.
    Instantiates the appropriate IPaymentGatewayAdapter for Razorpay, PayPal, Stripe, or COD.
    """

    _registry: dict[str, type[IPaymentGatewayAdapter]] = {
        "RAZORPAY": RazorpayPaymentAdapter,
        "PAYPAL": PayPalPaymentAdapter,
        "COD": CODPaymentAdapter,
    }

    @classmethod
    def register_adapter(cls, gateway_type: str, adapter_cls: type[IPaymentGatewayAdapter]):
        """Registers a custom payment gateway adapter."""
        cls._registry[gateway_type.upper()] = adapter_cls
        logger.info(f"Registered custom payment gateway adapter for '{gateway_type}'")

    @classmethod
    def get_adapter(cls, gateway_type: str) -> IPaymentGatewayAdapter:
        """
        Resolves and instantiates the IPaymentGatewayAdapter instance for the given gateway.
        """
        gateway_clean = gateway_type.strip().upper()
        adapter_cls = cls._registry.get(gateway_clean)
        if not adapter_cls:
            raise ValueError(f"Unsupported payment gateway '{gateway_type}'. Supported: {list(cls._registry.keys())}")
        return adapter_cls()
