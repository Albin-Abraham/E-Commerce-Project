# apps/payments/health/interfaces.py
"""
Domain interfaces, protocols, and data structures for payment gateway health monitoring.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import TYPE_CHECKING, Any

from django.db import models

if TYPE_CHECKING:
    from apps.payments.configuration.schemas import ResolvedPaymentGatewayConfig


class CheckStatus(models.TextChoices):
    SUCCESS = "SUCCESS", "Success"
    FAILED = "FAILED", "Failed"
    SKIPPED = "SKIPPED", "Skipped"
    UNKNOWN = "UNKNOWN", "Unknown"


class GatewayHealthStatus(models.TextChoices):
    UNKNOWN = "UNKNOWN", "Unknown"
    HEALTHY = "HEALTHY", "Healthy"
    DEGRADED = "DEGRADED", "Degraded"
    UNHEALTHY = "UNHEALTHY", "Unhealthy"
    DISABLED = "DISABLED", "Disabled"


@dataclass
class HealthCheckResult:
    """Represents the outcome of a single granular health probe."""

    check_type: str  # configuration, connectivity, authentication, readiness
    status: str  # CheckStatus values
    latency_ms: int = 0
    error_code: str | None = None
    error_message: str | None = None
    details: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return {
            "check_type": self.check_type,
            "status": self.status,
            "latency_ms": self.latency_ms,
            "error_code": self.error_code,
            "error_message": self.error_message,
            "details": self.details,
        }


@dataclass
class GatewayOverallHealthResult:
    """Represents the aggregated health and operational readiness of a gateway."""

    gateway_type: str
    overall_status: str  # GatewayHealthStatus values
    activation_status: str  # ENABLED, DISABLED, NOT_CONFIGURED
    checks: dict[str, HealthCheckResult] = field(default_factory=dict)
    total_latency_ms: int = 0
    checked_at: str = ""
    consecutive_failures: int = 0

    def to_dict(self) -> dict[str, Any]:
        return {
            "gateway_type": self.gateway_type,
            "overall_status": self.overall_status,
            "activation_status": self.activation_status,
            "checks": {k: v.to_dict() for k, v in self.checks.items()},
            "total_latency_ms": self.total_latency_ms,
            "checked_at": self.checked_at,
            "consecutive_failures": self.consecutive_failures,
        }


class IPaymentGatewayHealthChecker(ABC):
    """
    Contract for provider-specific payment gateway health checkers.
    """

    @abstractmethod
    def check_configuration(self, config: "ResolvedPaymentGatewayConfig") -> HealthCheckResult:
        """Validates configuration parameters and format locally."""
        raise NotImplementedError

    @abstractmethod
    def check_connectivity(self, config: "ResolvedPaymentGatewayConfig") -> HealthCheckResult:
        """Validates network transport, TLS handshake, and DNS reachability."""
        raise NotImplementedError

    @abstractmethod
    def check_authentication(self, config: "ResolvedPaymentGatewayConfig") -> HealthCheckResult:
        """Issues an authorized probe to verify API credentials."""
        raise NotImplementedError

    @abstractmethod
    def check_readiness(self, config: "ResolvedPaymentGatewayConfig") -> HealthCheckResult:
        """Assesses environmental alignment, modes, and currency support."""
        raise NotImplementedError

    @abstractmethod
    def run_all_checks(self, config: "ResolvedPaymentGatewayConfig") -> GatewayOverallHealthResult:
        """Executes all health checks sequentially and aggregates the overall status."""
        raise NotImplementedError
