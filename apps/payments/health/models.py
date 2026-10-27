# apps/payments/health/models.py
"""
Data model for tracking gateway health, connectivity, authentication, and readiness.
"""

from django.db import models
from django.utils import timezone

from apps.payments.health.interfaces import (
    CheckStatus,
    GatewayHealthStatus,
    GatewayOverallHealthResult,
)
from core.base_models.fields.char_fields import CustomCharField
from core.base_models.validator_model import BaseModel


class PaymentGatewayHealth(BaseModel):
    """
    Stores operational health assessments, latencies, failure counters,
    and diagnostic breakdowns for payment gateways.
    """

    gateway_config = models.OneToOneField(
        "payments.PaymentGatewayConfig",
        on_delete=models.CASCADE,
        related_name="health",
        null=True,
        blank=True,
    )
    gateway_type = CustomCharField(max_length=30, unique=True, db_index=True)
    status = models.CharField(
        max_length=20,
        choices=GatewayHealthStatus.choices,
        default=GatewayHealthStatus.UNKNOWN,
        db_index=True,
    )
    configuration_status = models.CharField(
        max_length=20,
        choices=CheckStatus.choices,
        default=CheckStatus.UNKNOWN,
    )
    connectivity_status = models.CharField(
        max_length=20,
        choices=CheckStatus.choices,
        default=CheckStatus.UNKNOWN,
    )
    authentication_status = models.CharField(
        max_length=20,
        choices=CheckStatus.choices,
        default=CheckStatus.UNKNOWN,
    )
    readiness_status = models.CharField(
        max_length=20,
        choices=CheckStatus.choices,
        default=CheckStatus.UNKNOWN,
    )
    last_checked_at = models.DateTimeField(null=True, blank=True)
    last_success_at = models.DateTimeField(null=True, blank=True)
    latency_ms = models.PositiveIntegerField(null=True, blank=True)
    last_error_code = models.CharField(max_length=100, blank=True, default="")
    last_error_message = models.TextField(blank=True, default="")
    consecutive_failures = models.PositiveIntegerField(default=0)
    details = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "payment_gateway_health"
        verbose_name = "Payment Gateway Health"
        verbose_name_plural = "Payment Gateway Health Records"

    def __str__(self):
        return f"{self.gateway_type} Health: {self.status} (Failures: {self.consecutive_failures})"

    def update_from_result(self, result: GatewayOverallHealthResult):
        """
        Updates the model fields from a GatewayOverallHealthResult instance.
        """
        now = timezone.now()
        self.status = result.overall_status
        self.last_checked_at = now
        self.latency_ms = result.total_latency_ms

        # Update granular statuses from checks dictionary
        checks = result.checks
        if "configuration" in checks:
            self.configuration_status = checks["configuration"].status
        if "connectivity" in checks:
            self.connectivity_status = checks["connectivity"].status
        if "authentication" in checks:
            self.authentication_status = checks["authentication"].status
        if "readiness" in checks:
            self.readiness_status = checks["readiness"].status

        # Track consecutive failures and success timestamp
        if result.overall_status == GatewayHealthStatus.HEALTHY:
            self.consecutive_failures = 0
            self.last_success_at = now
            self.last_error_code = ""
            self.last_error_message = ""
        else:
            self.consecutive_failures += 1
            # Extract first failing error message
            for c in checks.values():
                if c.status == CheckStatus.FAILED and c.error_message:
                    self.last_error_code = c.error_code or "PROBE_FAILURE"
                    self.last_error_message = c.error_message
                    break

        self.details = result.to_dict()
        self.save()
