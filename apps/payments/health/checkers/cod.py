# apps/payments/health/checkers/cod.py
"""
Health checker for Cash on Delivery (COD) payment method.
"""

from typing import TYPE_CHECKING
from apps.payments.health.interfaces import CheckStatus, HealthCheckResult
from apps.payments.health.checkers.base import BaseHealthChecker

if TYPE_CHECKING:
    from apps.payments.configuration.schemas import ResolvedPaymentGatewayConfig


class CODHealthChecker(BaseHealthChecker):
    """
    Evaluates Cash on Delivery readiness. Because COD is handled offline,
    checks validate currency and system availability locally.
    """

    def check_configuration(self, config: "ResolvedPaymentGatewayConfig") -> HealthCheckResult:
        return HealthCheckResult(
            check_type="configuration",
            status=CheckStatus.SUCCESS,
            details={"type": "OFFLINE_COD"},
        )

    def check_connectivity(self, config: "ResolvedPaymentGatewayConfig") -> HealthCheckResult:
        return HealthCheckResult(
            check_type="connectivity",
            status=CheckStatus.SUCCESS,
            latency_ms=0,
            details={"host": "localhost (in-process)"},
        )

    def check_authentication(self, config: "ResolvedPaymentGatewayConfig") -> HealthCheckResult:
        return HealthCheckResult(
            check_type="authentication",
            status=CheckStatus.SUCCESS,
            latency_ms=0,
            details={"auth_method": "NONE_REQUIRED"},
        )

    def check_readiness(self, config: "ResolvedPaymentGatewayConfig") -> HealthCheckResult:
        return HealthCheckResult(
            check_type="readiness",
            status=CheckStatus.SUCCESS,
            details={"is_active": config.is_active},
        )
