# apps/payments/health/checkers/base.py
"""
Base health checker implementing common infrastructure, SSRF protection,
secret redaction, latency tracking, and check pipeline orchestration.
"""

import logging
import time
import urllib.error
import urllib.parse
import urllib.request
from typing import TYPE_CHECKING

from django.utils import timezone

from apps.payments.health.interfaces import (
    CheckStatus,
    GatewayHealthStatus,
    GatewayOverallHealthResult,
    HealthCheckResult,
    IPaymentGatewayHealthChecker,
)
from core.configuration.security.redaction import mask_secret

if TYPE_CHECKING:
    from apps.payments.configuration.schemas import ResolvedPaymentGatewayConfig

logger = logging.getLogger(__name__)


class BaseHealthChecker(IPaymentGatewayHealthChecker):
    """
    Abstract base health checker with built-in SSRF protection,
    timeout enforcement, and standardized diagnostic reporting.
    """

    ALLOWED_HOSTS: set[str] = {
        "api.razorpay.com",
        "api-m.paypal.com",
        "api-m.sandbox.paypal.com",
    }

    def _validate_url(self, url: str) -> None:
        """
        SSRF Protection: Enforces that outbound probes only target trusted,
        hardcoded provider domain endpoints.
        """
        parsed = urllib.parse.urlparse(url)
        if parsed.scheme not in ("https",):
            raise ValueError(
                f"SSRF Protection: Insecure scheme '{parsed.scheme}'. Only HTTPS is permitted."
            )
        host = parsed.netloc.split(":")[0].lower()
        if host not in self.ALLOWED_HOSTS:
            raise ValueError(
                f"SSRF Protection: Host '{host}' is not in the allowed payment provider whitelist."
            )

    def _execute_http_probe(
        self,
        url: str,
        method: str = "GET",
        headers: dict[str, str] | None = None,
        data: bytes | None = None,
        timeout: float = 5.0,
    ) -> tuple[int, bytes, int]:
        """
        Executes a validated probe request and returns (status_code, body, latency_ms).
        """
        self._validate_url(url)
        hdrs = {"User-Agent": "YafeiPlatform-HealthProbe/1.0"}
        if headers:
            hdrs.update(headers)

        req = urllib.request.Request(url, data=data, headers=hdrs, method=method)
        start_time = time.perf_counter()
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                elapsed_ms = int((time.perf_counter() - start_time) * 1000)
                return resp.status, resp.read(), elapsed_ms
        except urllib.error.HTTPError as exc:
            elapsed_ms = int((time.perf_counter() - start_time) * 1000)
            return exc.code, exc.read(), elapsed_ms
        except Exception as exc:
            elapsed_ms = int((time.perf_counter() - start_time) * 1000)
            raise exc

    def _sanitize_message(self, message: str) -> str:
        """Redacts sensitive credentials from error messages."""
        return mask_secret(message, visible_prefix=6, visible_suffix=3) if message else ""

    def run_all_checks(self, config: "ResolvedPaymentGatewayConfig") -> GatewayOverallHealthResult:
        """
        Orchestrates the sequential 4-level health check pipeline.
        """
        checks: dict[str, HealthCheckResult] = {}
        total_latency = 0

        # Check 1: Configuration
        config_res = self.check_configuration(config)
        checks["configuration"] = config_res
        total_latency += config_res.latency_ms

        if config_res.status == CheckStatus.FAILED:
            return GatewayOverallHealthResult(
                gateway_type=config.gateway_type,
                overall_status=GatewayHealthStatus.UNHEALTHY,
                activation_status="ENABLED" if config.is_active else "DISABLED",
                checks=checks,
                total_latency_ms=total_latency,
                checked_at=timezone.now().isoformat(),
            )

        # Check 2: Connectivity
        conn_res = self.check_connectivity(config)
        checks["connectivity"] = conn_res
        total_latency += conn_res.latency_ms

        if conn_res.status == CheckStatus.FAILED:
            # Connectivity failed -> Auth and Readiness cannot be evaluated
            checks["authentication"] = HealthCheckResult(
                check_type="authentication",
                status=CheckStatus.SKIPPED,
                error_message="Skipped due to connectivity failure",
            )
            checks["readiness"] = HealthCheckResult(
                check_type="readiness",
                status=CheckStatus.SKIPPED,
                error_message="Skipped due to connectivity failure",
            )
            return GatewayOverallHealthResult(
                gateway_type=config.gateway_type,
                overall_status=GatewayHealthStatus.UNHEALTHY,
                activation_status="ENABLED" if config.is_active else "DISABLED",
                checks=checks,
                total_latency_ms=total_latency,
                checked_at=timezone.now().isoformat(),
            )

        # Check 3: Authentication
        auth_res = self.check_authentication(config)
        checks["authentication"] = auth_res
        total_latency += auth_res.latency_ms

        # Check 4: Readiness
        readiness_res = self.check_readiness(config)
        checks["readiness"] = readiness_res
        total_latency += readiness_res.latency_ms

        # Determine aggregate status
        if auth_res.status == CheckStatus.FAILED or readiness_res.status == CheckStatus.FAILED:
            overall_status = GatewayHealthStatus.UNHEALTHY
        elif conn_res.latency_ms > 1500 or auth_res.latency_ms > 2000:
            # Elevated latency constitutes DEGRADED state
            overall_status = GatewayHealthStatus.DEGRADED
        else:
            overall_status = GatewayHealthStatus.HEALTHY

        return GatewayOverallHealthResult(
            gateway_type=config.gateway_type,
            overall_status=overall_status,
            activation_status="ENABLED" if config.is_active else "DISABLED",
            checks=checks,
            total_latency_ms=total_latency,
            checked_at=timezone.now().isoformat(),
        )
