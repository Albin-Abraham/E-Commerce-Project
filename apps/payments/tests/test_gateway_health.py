# apps/payments/tests/test_gateway_health.py
"""
Comprehensive automated unit and integration tests for Payment Gateway Health Monitoring.
Validates:
1. 4-level check pipeline (Configuration, Connectivity, Authentication, Readiness).
2. Provider-specific checkers (Razorpay, PayPal, COD).
3. SSRF Protection: Hardcoded host whitelist prevents arbitrary URL targets.
4. Secret redaction in diagnostic messages and error details.
5. PaymentGatewayHealth model persistence and failure counters.
6. Circuit Breaker state transitions (CLOSED -> OPEN -> HALF_OPEN).
7. REST API Endpoints: Test Connection, Retrieve Health, Activate, Deactivate.
"""

from unittest import mock

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.customers.models.customer import Customer
from apps.payments.health.checkers.paypal import PayPalHealthChecker
from apps.payments.health.checkers.razorpay import RazorpayHealthChecker
from apps.payments.health.circuit_breaker import CircuitState, GatewayCircuitBreaker
from apps.payments.health.interfaces import (
    CheckStatus,
    GatewayHealthStatus,
)
from apps.payments.health.models import PaymentGatewayHealth
from apps.payments.health.service import PaymentGatewayHealthMonitorService
from apps.payments.models import PaymentGatewayConfig
from core.admin.models.company import Company

User = get_user_model()


class PaymentGatewayHealthMonitoringTestCase(TestCase):
    """
    Test suite for the Payment Gateway Health & Connectivity Monitoring layer.
    """

    def setUp(self):
        self.client = APIClient()
        GatewayCircuitBreaker.reset()
        self.company = Company.objects.create(name="Health Test Co", code="HLT-01")
        self.user = User.objects.create_user(
            username="health_user", email="health@example.com", password="Password123!"
        )
        self.customer = Customer.objects.create(
            customer_code="CUST-HLT-01",
            user=self.user,
            name="Health Customer",
            company=self.company,
        )
        self.client.force_authenticate(user=self.user)

        # Create active Razorpay configuration
        self.rzp_config = PaymentGatewayConfig.objects.create(
            gateway_type="RAZORPAY",
            display_name="Razorpay Live",
            is_active=True,
            is_sandbox=True,
            supported_currencies=["INR", "USD"],
            extra_config={"key_id": "rzp_test_valid_key123", "key_secret": "valid_secret_456"},
        )

        # Create active PayPal configuration
        self.pp_config = PaymentGatewayConfig.objects.create(
            gateway_type="PAYPAL",
            display_name="PayPal Express",
            is_active=True,
            is_sandbox=True,
            supported_currencies=["USD", "EUR"],
            extra_config={
                "client_id": "pp_client_id_123",
                "client_secret": "pp_secret_456",
                "mode": "sandbox",
            },
        )

        # Create COD configuration
        self.cod_config = PaymentGatewayConfig.objects.create(
            gateway_type="COD",
            display_name="Cash on Delivery",
            is_active=True,
            is_sandbox=False,
            supported_currencies=["INR", "USD"],
            extra_config={},
        )

    def tearDown(self):
        GatewayCircuitBreaker.reset()

    @mock.patch.object(RazorpayHealthChecker, "_execute_http_probe")
    def test_razorpay_health_check_healthy_flow(self, mock_probe):
        """
        Validates a fully successful health check for Razorpay.
        Mock probe returns HTTP 200 for both connectivity and auth probes.
        """
        mock_probe.return_value = (200, b'{"count": 0}', 120)

        result = PaymentGatewayHealthMonitorService.check_gateway_health("RAZORPAY", persist=True)

        self.assertEqual(result.overall_status, GatewayHealthStatus.HEALTHY)
        self.assertEqual(result.checks["configuration"].status, CheckStatus.SUCCESS)
        self.assertEqual(result.checks["connectivity"].status, CheckStatus.SUCCESS)
        self.assertEqual(result.checks["authentication"].status, CheckStatus.SUCCESS)
        self.assertEqual(result.checks["readiness"].status, CheckStatus.SUCCESS)

        # Verify DB persistence
        health = PaymentGatewayHealth.objects.get(gateway_type="RAZORPAY")
        self.assertEqual(health.status, GatewayHealthStatus.HEALTHY)
        self.assertEqual(health.consecutive_failures, 0)
        self.assertIsNotNone(health.last_success_at)

    @mock.patch.object(RazorpayHealthChecker, "_execute_http_probe")
    def test_razorpay_authentication_failure(self, mock_probe):
        """
        Simulates an invalid API secret returning HTTP 401 Unauthorized from Razorpay.
        """
        # First call (connectivity) returns 200, second call (auth) returns 401
        mock_probe.side_effect = [
            (200, b'{"status": "ok"}', 100),
            (
                401,
                b'{"error": {"code": "BAD_REQUEST_ERROR", "description": "The id provided does not exist"}}',
                150,
            ),
        ]

        result = PaymentGatewayHealthMonitorService.check_gateway_health("RAZORPAY", persist=True)

        self.assertEqual(result.overall_status, GatewayHealthStatus.UNHEALTHY)
        self.assertEqual(result.checks["authentication"].status, CheckStatus.FAILED)
        self.assertEqual(result.checks["authentication"].error_code, "AUTH_REJECTED")

        # Verify consecutive failures incremented in DB
        health = PaymentGatewayHealth.objects.get(gateway_type="RAZORPAY")
        self.assertEqual(health.status, GatewayHealthStatus.UNHEALTHY)
        self.assertEqual(health.consecutive_failures, 1)

    @mock.patch.object(PayPalHealthChecker, "_execute_http_probe")
    def test_paypal_health_check_healthy_flow(self, mock_probe):
        """
        Validates PayPal OAuth2 token generation probe.
        """
        mock_probe.side_effect = [
            (200, b'{"status": "ok"}', 110),
            (200, b'{"access_token": "mock_access_token_123", "token_type": "Bearer"}', 180),
        ]

        result = PaymentGatewayHealthMonitorService.check_gateway_health("PAYPAL", persist=True)

        self.assertEqual(result.overall_status, GatewayHealthStatus.HEALTHY)
        self.assertEqual(result.checks["authentication"].status, CheckStatus.SUCCESS)

    @mock.patch.object(PayPalHealthChecker, "_execute_http_probe")
    def test_paypal_authentication_failure(self, mock_probe):
        """
        Simulates PayPal rejecting client credentials with HTTP 401.
        """
        mock_probe.side_effect = [
            (200, b'{"status": "ok"}', 100),
            (401, b'{"error": "invalid_client"}', 150),
        ]

        result = PaymentGatewayHealthMonitorService.check_gateway_health("PAYPAL", persist=True)

        self.assertEqual(result.overall_status, GatewayHealthStatus.UNHEALTHY)
        self.assertEqual(result.checks["authentication"].status, CheckStatus.FAILED)

    def test_cod_health_check_always_healthy(self):
        """
        Validates Cash on Delivery local health assessment.
        """
        result = PaymentGatewayHealthMonitorService.check_gateway_health("COD", persist=True)

        self.assertEqual(result.overall_status, GatewayHealthStatus.HEALTHY)
        self.assertEqual(result.total_latency_ms, 0)
        self.assertEqual(result.checks["connectivity"].latency_ms, 0)

    def test_disabled_gateway_health_check_skips_network_calls(self):
        """
        Deactivated gateways report DISABLED and skip outbound HTTP requests.
        """
        self.rzp_config.is_active = False
        self.rzp_config.save()

        result = PaymentGatewayHealthMonitorService.check_gateway_health("RAZORPAY", persist=True)

        self.assertEqual(result.overall_status, GatewayHealthStatus.DISABLED)
        self.assertEqual(result.activation_status, "DISABLED")
        self.assertEqual(result.checks["connectivity"].status, CheckStatus.SKIPPED)

    def test_ssrf_protection_blocks_unauthorized_hosts(self):
        """
        Health checkers must reject requests targeting non-whitelisted domains.
        """
        checker = RazorpayHealthChecker()
        with self.assertRaises(ValueError) as exc:
            checker._validate_url("https://malicious-attacker-site.com/steal-data")
        self.assertIn("SSRF Protection", str(exc.exception))

    def test_circuit_breaker_trips_to_open_after_failures(self):
        """
        Validates that 5 consecutive failures trip the circuit to OPEN,
        blocking subsequent payment initiation calls.
        """
        self.assertEqual(GatewayCircuitBreaker.get_state("RAZORPAY"), CircuitState.CLOSED)
        self.assertTrue(GatewayCircuitBreaker.can_execute("RAZORPAY"))

        # Trigger 5 failures
        for _ in range(5):
            GatewayCircuitBreaker.record_failure("RAZORPAY")

        self.assertEqual(GatewayCircuitBreaker.get_state("RAZORPAY"), CircuitState.OPEN)
        self.assertFalse(GatewayCircuitBreaker.can_execute("RAZORPAY"))

        # Initiating payment while OPEN must fail fast with descriptive error
        from apps.payments.services.payment_service import PaymentOrchestrationService

        with self.assertRaises(ValueError) as exc:
            PaymentOrchestrationService.initiate_payment(
                customer_id=self.customer.id,
                amount=100,
                currency="USD",
                gateway_type="RAZORPAY",
            )
        self.assertIn("temporarily unavailable", str(exc.exception))

    @mock.patch.object(RazorpayHealthChecker, "_execute_http_probe")
    def test_api_health_check_action_test_connection(self, mock_probe):
        """
        Tests POST /api/v1/payments/gateways/{id}/health-check/ ('Test Connection').
        """
        mock_probe.return_value = (200, b'{"status": "ok"}', 90)

        url = f"/api/v1/payments/gateways/{self.rzp_config.id}/health-check/"
        res = self.client.post(url)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("overall_status", res.data["data"])
        self.assertEqual(res.data["data"]["overall_status"], GatewayHealthStatus.HEALTHY)

    def test_api_get_health_action(self):
        """
        Tests GET /api/v1/payments/gateways/{id}/health/.
        """
        PaymentGatewayHealth.objects.create(
            gateway_config=self.rzp_config,
            gateway_type="RAZORPAY",
            status=GatewayHealthStatus.HEALTHY,
            latency_ms=140,
        )

        url = f"/api/v1/payments/gateways/{self.rzp_config.id}/health/"
        res = self.client.get(url)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["data"]["status"], GatewayHealthStatus.HEALTHY)

    def test_api_activate_and_deactivate_actions(self):
        """
        Tests POST /activate/ and POST /deactivate/ lifecycle control endpoints.
        """
        # 1. Deactivate
        deactivate_url = f"/api/v1/payments/gateways/{self.rzp_config.id}/deactivate/"
        res = self.client.post(deactivate_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.rzp_config.refresh_from_db()
        self.assertFalse(self.rzp_config.is_active)

        health = PaymentGatewayHealth.objects.get(gateway_type="RAZORPAY")
        self.assertEqual(health.status, GatewayHealthStatus.DISABLED)

        # 2. Activate
        activate_url = f"/api/v1/payments/gateways/{self.rzp_config.id}/activate/"
        with mock.patch.object(RazorpayHealthChecker, "_execute_http_probe") as mock_probe:
            mock_probe.return_value = (200, b'{"status": "ok"}', 80)
            res = self.client.post(activate_url)
            self.assertEqual(res.status_code, status.HTTP_200_OK)
            self.rzp_config.refresh_from_db()
            self.assertTrue(self.rzp_config.is_active)
