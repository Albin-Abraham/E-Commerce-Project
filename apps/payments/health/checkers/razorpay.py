# apps/payments/health/checkers/razorpay.py
"""
Provider-specific health checker for Razorpay.
"""

import base64
import logging
from typing import TYPE_CHECKING

from apps.payments.health.checkers.base import BaseHealthChecker
from apps.payments.health.interfaces import CheckStatus, HealthCheckResult

if TYPE_CHECKING:
    from apps.payments.configuration.schemas import ResolvedPaymentGatewayConfig

logger = logging.getLogger(__name__)


class RazorpayHealthChecker(BaseHealthChecker):
    """
    Evaluates Razorpay configuration validity, network reachability,
    API key authorization, and capability readiness.
    """

    RAZORPAY_API_URL = "https://api.razorpay.com/v1/orders"

    def check_configuration(self, config: "ResolvedPaymentGatewayConfig") -> HealthCheckResult:
        if not config.api_key or not config.api_secret:
            return HealthCheckResult(
                check_type="configuration",
                status=CheckStatus.FAILED,
                error_code="MISSING_CREDENTIALS",
                error_message="Razorpay key_id or key_secret is missing.",
            )

        key = config.api_key.strip()
        expected_prefix = "rzp_test_" if config.is_sandbox else "rzp_live_"
        details = {"is_sandbox": config.is_sandbox, "key_prefix": key[:9]}

        if not (
            key.startswith("rzp_test_") or key.startswith("rzp_live_") or key.startswith("rzp_")
        ):
            return HealthCheckResult(
                check_type="configuration",
                status=CheckStatus.FAILED,
                error_code="INVALID_KEY_FORMAT",
                error_message=f"Razorpay key '{key[:8]}' does not conform to expected 'rzp_test_' or 'rzp_live_' format.",
                details=details,
            )

        return HealthCheckResult(
            check_type="configuration",
            status=CheckStatus.SUCCESS,
            details=details,
        )

    def check_connectivity(self, config: "ResolvedPaymentGatewayConfig") -> HealthCheckResult:
        try:
            status_code, _, latency = self._execute_http_probe(
                url=self.RAZORPAY_API_URL,
                method="GET",
                timeout=5.0,
            )
            # Even if 401 is returned (unauthorized), DNS/TLS connectivity succeeded
            return HealthCheckResult(
                check_type="connectivity",
                status=CheckStatus.SUCCESS,
                latency_ms=latency,
                details={"http_status": status_code, "host": "api.razorpay.com"},
            )
        except Exception as exc:
            return HealthCheckResult(
                check_type="connectivity",
                status=CheckStatus.FAILED,
                error_code="CONNECTIVITY_ERROR",
                error_message=self._sanitize_message(str(exc)),
                details={"host": "api.razorpay.com"},
            )

    def check_authentication(self, config: "ResolvedPaymentGatewayConfig") -> HealthCheckResult:
        auth_str = base64.b64encode(f"{config.api_key}:{config.api_secret}".encode()).decode(
            "utf-8"
        )
        headers = {
            "Authorization": f"Basic {auth_str}",
            "Content-Type": "application/json",
        }

        try:
            status_code, body, latency = self._execute_http_probe(
                url=self.RAZORPAY_API_URL,
                method="GET",
                headers=headers,
                timeout=6.0,
            )

            # HTTP 401 or 403 means bad credentials
            if status_code in (401, 403):
                return HealthCheckResult(
                    check_type="authentication",
                    status=CheckStatus.FAILED,
                    latency_ms=latency,
                    error_code="AUTH_REJECTED",
                    error_message="Razorpay rejected credentials (HTTP 401 Unauthorized).",
                    details={"http_status": status_code},
                )

            # 200 OK or 400 (Bad request with auth accepted) indicates credentials were authenticated
            return HealthCheckResult(
                check_type="authentication",
                status=CheckStatus.SUCCESS,
                latency_ms=latency,
                details={"http_status": status_code},
            )

        except Exception as exc:
            return HealthCheckResult(
                check_type="authentication",
                status=CheckStatus.FAILED,
                error_code="PROBE_ERROR",
                error_message=self._sanitize_message(str(exc)),
            )

    def check_readiness(self, config: "ResolvedPaymentGatewayConfig") -> HealthCheckResult:
        currencies = [c.upper() for c in config.supported_currencies]
        if "INR" not in currencies and "USD" not in currencies:
            return HealthCheckResult(
                check_type="readiness",
                status=CheckStatus.FAILED,
                error_code="UNSUPPORTED_CURRENCY",
                error_message="Razorpay requires at least 'INR' or 'USD' in supported currencies.",
                details={"supported_currencies": currencies},
            )

        return HealthCheckResult(
            check_type="readiness",
            status=CheckStatus.SUCCESS,
            details={"currencies": currencies, "is_sandbox": config.is_sandbox},
        )
