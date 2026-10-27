# apps/payments/health/registry.py
"""
Registry for payment gateway health checkers (GoF Strategy / Registry Pattern).
"""

import logging

from apps.payments.health.checkers.cod import CODHealthChecker
from apps.payments.health.checkers.paypal import PayPalHealthChecker
from apps.payments.health.checkers.razorpay import RazorpayHealthChecker
from apps.payments.health.interfaces import IPaymentGatewayHealthChecker

logger = logging.getLogger(__name__)


class PaymentGatewayHealthCheckerRegistry:
    """
    Central registry mapping gateway types to health checker strategies.
    """

    _registry: dict[str, type[IPaymentGatewayHealthChecker]] = {
        "RAZORPAY": RazorpayHealthChecker,
        "PAYPAL": PayPalHealthChecker,
        "COD": CODHealthChecker,
    }

    @classmethod
    def register_checker(cls, gateway_type: str, checker_cls: type[IPaymentGatewayHealthChecker]):
        """Registers a custom health checker for a new gateway type."""
        cls._registry[gateway_type.upper()] = checker_cls
        logger.info(f"Registered payment gateway health checker for '{gateway_type.upper()}'")

    @classmethod
    def get_checker(cls, gateway_type: str) -> IPaymentGatewayHealthChecker:
        """Resolves and instantiates the health checker for the given gateway."""
        cleaned = gateway_type.strip().upper()
        checker_cls = cls._registry.get(cleaned)
        if not checker_cls:
            raise ValueError(
                f"No health checker registered for payment gateway '{gateway_type}'. Supported: {list(cls._registry.keys())}"
            )
        return checker_cls()
