# apps/payments/health/service.py
"""
High-level service orchestrating payment gateway health monitoring,
persistence, and readiness assessments.
"""

import logging

from django.utils import timezone

from apps.payments.configuration.exceptions import (
    GatewayConfigurationError,
    GatewayDisabledError,
    GatewayNotConfiguredError,
)
from apps.payments.configuration.resolver import PaymentGatewayConfigResolver
from apps.payments.health.circuit_breaker import GatewayCircuitBreaker
from apps.payments.health.interfaces import (
    CheckStatus,
    GatewayHealthStatus,
    GatewayOverallHealthResult,
    HealthCheckResult,
)
from apps.payments.health.registry import PaymentGatewayHealthCheckerRegistry

logger = logging.getLogger(__name__)


class PaymentGatewayHealthMonitorService:
    """
    Central service for running gateway health checks, persisting diagnostics,
    and managing circuit breaker inputs.
    """

    SUPPORTED_GATEWAYS = ["RAZORPAY", "PAYPAL", "COD"]

    @classmethod
    def check_gateway_health(
        cls,
        gateway_type: str,
        tenant_id: str | None = None,
        persist: bool = True,
    ) -> GatewayOverallHealthResult:
        """
        Executes a complete 4-tier health check for the specified gateway.
        """
        cleaned = gateway_type.strip().upper()
        now_iso = timezone.now().isoformat()

        # Step 1: Attempt configuration resolution
        try:
            config = PaymentGatewayConfigResolver.resolve_gateway(cleaned, tenant_id=tenant_id)
        except GatewayDisabledError:
            # Gateway explicitly disabled in DB
            result = GatewayOverallHealthResult(
                gateway_type=cleaned,
                overall_status=GatewayHealthStatus.DISABLED,
                activation_status="DISABLED",
                checks={
                    "configuration": HealthCheckResult(
                        check_type="configuration",
                        status=CheckStatus.SUCCESS,
                        details={"is_active": False},
                    ),
                    "connectivity": HealthCheckResult(
                        check_type="connectivity",
                        status=CheckStatus.SKIPPED,
                        error_message="Skipped: Gateway is disabled",
                    ),
                    "authentication": HealthCheckResult(
                        check_type="authentication",
                        status=CheckStatus.SKIPPED,
                        error_message="Skipped: Gateway is disabled",
                    ),
                    "readiness": HealthCheckResult(
                        check_type="readiness",
                        status=CheckStatus.SKIPPED,
                        error_message="Skipped: Gateway is disabled",
                    ),
                },
                total_latency_ms=0,
                checked_at=now_iso,
            )
            if persist:
                cls._persist_health_result(cleaned, result)
            return result

        except (GatewayNotConfiguredError, GatewayConfigurationError) as exc:
            # Gateway not configured or malformed
            result = GatewayOverallHealthResult(
                gateway_type=cleaned,
                overall_status=GatewayHealthStatus.UNHEALTHY,
                activation_status="NOT_CONFIGURED",
                checks={
                    "configuration": HealthCheckResult(
                        check_type="configuration",
                        status=CheckStatus.FAILED,
                        error_code="CONFIGURATION_ERROR",
                        error_message=str(exc),
                    ),
                    "connectivity": HealthCheckResult(
                        check_type="connectivity",
                        status=CheckStatus.SKIPPED,
                    ),
                    "authentication": HealthCheckResult(
                        check_type="authentication",
                        status=CheckStatus.SKIPPED,
                    ),
                    "readiness": HealthCheckResult(
                        check_type="readiness",
                        status=CheckStatus.SKIPPED,
                    ),
                },
                total_latency_ms=0,
                checked_at=now_iso,
            )
            if persist:
                cls._persist_health_result(cleaned, result)
            return result

        # Step 2: Run provider-specific health checker
        checker = PaymentGatewayHealthCheckerRegistry.get_checker(cleaned)
        result = checker.run_all_checks(config)

        # Step 3: Update circuit breaker
        if result.overall_status == GatewayHealthStatus.HEALTHY:
            GatewayCircuitBreaker.record_success(cleaned)
        elif result.overall_status == GatewayHealthStatus.UNHEALTHY:
            GatewayCircuitBreaker.record_failure(cleaned)

        # Step 4: Persist health status if requested
        if persist:
            cls._persist_health_result(cleaned, result)

        return result

    @classmethod
    def _persist_health_result(cls, gateway_type: str, result: GatewayOverallHealthResult):
        """Persists the health check result to PaymentGatewayHealth model."""
        try:
            from apps.payments.health.models import PaymentGatewayHealth
            from apps.payments.models import PaymentGatewayConfig

            domain_config = PaymentGatewayConfig.objects.filter(gateway_type=gateway_type).first()
            health, _ = PaymentGatewayHealth.objects.get_or_create(gateway_type=gateway_type)
            if domain_config:
                health.gateway_config = domain_config
            health.update_from_result(result)
        except Exception as exc:
            logger.error(f"Failed to persist PaymentGatewayHealth for '{gateway_type}': {exc}")

    @classmethod
    def check_all_gateways(cls, persist: bool = True) -> list[GatewayOverallHealthResult]:
        """
        Runs health checks across all supported and configured gateways.
        """
        results = []
        for gateway in cls.SUPPORTED_GATEWAYS:
            res = cls.check_gateway_health(gateway, persist=persist)
            results.append(res)
        return results

    @classmethod
    def assess_readiness(cls, gateway_type: str) -> bool:
        """
        Fast operational readiness assessment used by checkout workflows.
        Checks both circuit breaker status and latest recorded health.
        """
        cleaned = gateway_type.strip().upper()

        # 1. Circuit breaker must permit execution
        if not GatewayCircuitBreaker.can_execute(cleaned):
            logger.warning(
                f"Gateway '{cleaned}' rejected by circuit breaker (state: {GatewayCircuitBreaker.get_state(cleaned)})"
            )
            return False

        # 2. Persisted health must not be explicitly disabled
        try:
            from apps.payments.health.models import PaymentGatewayHealth

            health = PaymentGatewayHealth.objects.filter(gateway_type=cleaned).first()
            if health and health.status == GatewayHealthStatus.DISABLED:
                return False
        except Exception:
            pass

        return True
