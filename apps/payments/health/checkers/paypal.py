# apps/payments/health/checkers/paypal.py
"""
Provider-specific health checker for PayPal Express Checkout.
"""

import base64
import json
import logging
import urllib.parse
from typing import TYPE_CHECKING

from apps.payments.health.checkers.base import BaseHealthChecker
from apps.payments.health.interfaces import CheckStatus, HealthCheckResult

if TYPE_CHECKING:
    from apps.payments.configuration.schemas import ResolvedPaymentGatewayConfig

logger = logging.getLogger(__name__)


class PayPalHealthChecker(BaseHealthChecker):
    """
    Evaluates PayPal configuration, connectivity, OAuth2 token authentication,
    and capability readiness.
    """

    def _get_base_url(self, is_sandbox: bool) -> str:
        return "https://api-m.sandbox.paypal.com" if is_sandbox else "https://api-m.paypal.com"

    def check_configuration(self, config: "ResolvedPaymentGatewayConfig") -> HealthCheckResult:
        if not config.api_key or not config.api_secret:
            return HealthCheckResult(
                check_type="configuration",
                status=CheckStatus.FAILED,
                error_code="MISSING_CREDENTIALS",
                error_message="PayPal client_id or client_secret is missing.",
            )

        return HealthCheckResult(
            check_type="configuration",
            status=CheckStatus.SUCCESS,
            details={"is_sandbox": config.is_sandbox},
        )

    def check_connectivity(self, config: "ResolvedPaymentGatewayConfig") -> HealthCheckResult:
        base_url = self._get_base_url(config.is_sandbox)
        url = f"{base_url}/v1/oauth2/token"

        try:
            status_code, _, latency = self._execute_http_probe(
                url=url,
                method="GET",
                timeout=5.0,
            )
            return HealthCheckResult(
                check_type="connectivity",
                status=CheckStatus.SUCCESS,
                latency_ms=latency,
                details={"http_status": status_code, "host": base_url},
            )
        except Exception as exc:
            return HealthCheckResult(
                check_type="connectivity",
                status=CheckStatus.FAILED,
                error_code="CONNECTIVITY_ERROR",
                error_message=self._sanitize_message(str(exc)),
                details={"host": base_url},
            )

    def check_authentication(self, config: "ResolvedPaymentGatewayConfig") -> HealthCheckResult:
        base_url = self._get_base_url(config.is_sandbox)
        url = f"{base_url}/v1/oauth2/token"

        auth_str = base64.b64encode(f"{config.api_key}:{config.api_secret}".encode()).decode(
            "utf-8"
        )
        headers = {
            "Authorization": f"Basic {auth_str}",
            "Content-Type": "application/x-www-form-urlencoded",
        }
        data = urllib.parse.urlencode({"grant_type": "client_credentials"}).encode("utf-8")

        try:
            status_code, body, latency = self._execute_http_probe(
                url=url,
                method="POST",
                headers=headers,
                data=data,
                timeout=8.0,
            )

            if status_code == 200:
                resp = json.loads(body.decode("utf-8"))
                if "access_token" in resp:
                    return HealthCheckResult(
                        check_type="authentication",
                        status=CheckStatus.SUCCESS,
                        latency_ms=latency,
                        details={"token_type": resp.get("token_type", "Bearer")},
                    )

            # Failure (401 invalid client or non-200)
            return HealthCheckResult(
                check_type="authentication",
                status=CheckStatus.FAILED,
                latency_ms=latency,
                error_code="AUTH_REJECTED",
                error_message=f"PayPal rejected credentials (HTTP {status_code}).",
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
        if "USD" not in currencies and "EUR" not in currencies:
            return HealthCheckResult(
                check_type="readiness",
                status=CheckStatus.FAILED,
                error_code="UNSUPPORTED_CURRENCY",
                error_message="PayPal integration requires at least 'USD' or 'EUR'.",
                details={"supported_currencies": currencies},
            )

        return HealthCheckResult(
            check_type="readiness",
            status=CheckStatus.SUCCESS,
            details={"currencies": currencies, "is_sandbox": config.is_sandbox},
        )
