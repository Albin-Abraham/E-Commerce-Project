# apps/payments/tests/test_gateway_resolution.py
"""
Comprehensive test suite verifying hierarchical database configuration & credential resolution.
Validates:
1. 4-State Lifecycle Machine (DISABLED, ACTIVE, NOT_CONFIGURED, INVALID).
2. Strict isolation: Disabled gateway never falls back to legacy credentials.
3. Incomplete domain configuration never falls back to legacy credentials.
4. Correct fallback from NOT_CONFIGURED to SystemConfig, then environment.
5. Secret masking and redaction.
6. HTTP Status Code mappings (409 Conflict, 503 Service Unavailable).
"""

import os
from decimal import Decimal
from unittest import mock
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from core.base_models.system_models import SystemConfig
from core.admin.models.company import Company
from apps.customers.models.customer import Customer
from apps.payments.models import PaymentGatewayConfig
from apps.payments.configuration.resolver import PaymentGatewayConfigResolver
from apps.payments.configuration.exceptions import (
    GatewayDisabledError,
    GatewayNotConfiguredError,
    GatewayConfigurationError,
)
from apps.payments.adapters.factory import PaymentGatewayAdapterFactory
from apps.payments.adapters.razorpay_adapter import RazorpayPaymentAdapter
from apps.payments.adapters.paypal_adapter import PayPalPaymentAdapter

User = get_user_model()


class GatewayResolutionTestSuite(TestCase):
    """
    Test suite for hierarchical payment configuration resolution.
    """

    def setUp(self):
        self.client = APIClient()
        self.company = Company.objects.create(name="Resolution Test Co", code="RES-01")
        self.user = User.objects.create_user(username="res_user", email="res@example.com", password="Password123!")
        self.customer = Customer.objects.create(
            customer_code="CUST-RES-01",
            user=self.user,
            name="Resolution Customer",
            company=self.company,
        )

    def test_disabled_gateway_raises_error_and_never_falls_back(self):
        """
        CRITICAL TEST: If PaymentGatewayConfig exists with is_active=False,
        resolution MUST raise GatewayDisabledError and NEVER fall back to SystemConfig or env.
        """
        # Populate legacy SystemConfig with valid credentials
        SystemConfig.objects.create(key="RAZORPAY_KEY_ID", value="rzp_legacy_key")
        SystemConfig.objects.create(key="RAZORPAY_KEY_SECRET", value="rzp_legacy_secret")

        # Explicitly disable Razorpay in Domain DB
        PaymentGatewayConfig.objects.create(
            gateway_type="RAZORPAY",
            display_name="Razorpay Gateway",
            is_active=False,
            is_sandbox=True,
            extra_config={"key_id": "rzp_domain_key", "key_secret": "rzp_domain_secret"},
        )

        # 1. Direct resolver call must raise GatewayDisabledError
        with self.assertRaises(GatewayDisabledError) as exc_info:
            PaymentGatewayConfigResolver.resolve_gateway("RAZORPAY")
        self.assertIn("disabled by platform administrators", str(exc_info.exception))

        # 2. Factory call must raise GatewayDisabledError
        with self.assertRaises(GatewayDisabledError):
            PaymentGatewayAdapterFactory.get_adapter("RAZORPAY")

        # 3. API initiation endpoint must return HTTP 409 CONFLICT
        res = self.client.post("/api/v1/payments/transactions/initiate/", {
            "customer_id": str(self.customer.id),
            "amount": "120.00",
            "currency": "USD",
            "gateway_type": "RAZORPAY",
        })
        self.assertEqual(res.status_code, status.HTTP_409_CONFLICT)
        self.assertIn("disabled", res.data.get("message", "").lower())

    def test_active_domain_gateway_resolves_successfully(self):
        """
        Active PaymentGatewayConfig in DB must resolve with source='DOMAIN_DB'.
        """
        PaymentGatewayConfig.objects.create(
            gateway_type="RAZORPAY",
            display_name="Razorpay Production",
            is_active=True,
            is_sandbox=False,
            merchant_id="merchant_abc",
            supported_currencies=["INR", "USD"],
            extra_config={"key_id": "rzp_live_domain_key", "key_secret": "rzp_live_domain_secret"},
        )

        config = PaymentGatewayConfigResolver.resolve_gateway("RAZORPAY")
        self.assertEqual(config.source, "DOMAIN_DB")
        self.assertEqual(config.api_key, "rzp_live_domain_key")
        self.assertEqual(config.api_secret, "rzp_live_domain_secret")
        self.assertFalse(config.is_sandbox)

        adapter = PaymentGatewayAdapterFactory.get_adapter("RAZORPAY")
        self.assertIsInstance(adapter, RazorpayPaymentAdapter)
        self.assertEqual(adapter.key_id, "rzp_live_domain_key")
        self.assertEqual(adapter.key_secret, "rzp_live_domain_secret")

    def test_active_domain_gateway_with_missing_secret_fails_and_never_falls_back(self):
        """
        If domain record is active but missing required credentials (e.g. key_secret),
        it MUST raise GatewayConfigurationError and NEVER fall back to legacy credentials.
        """
        # Legacy credentials present
        SystemConfig.objects.create(key="RAZORPAY_KEY_ID", value="rzp_legacy_key")
        SystemConfig.objects.create(key="RAZORPAY_KEY_SECRET", value="rzp_legacy_secret")

        # Active domain record missing key_secret
        PaymentGatewayConfig.objects.create(
            gateway_type="RAZORPAY",
            display_name="Broken Razorpay",
            is_active=True,
            extra_config={"key_id": "rzp_domain_key"},  # Missing key_secret!
        )

        with self.assertRaises(GatewayConfigurationError) as exc_info:
            PaymentGatewayConfigResolver.resolve_gateway("RAZORPAY")
        self.assertIn("key_secret", str(exc_info.exception))

    def test_not_configured_domain_gateway_falls_back_to_system_config(self):
        """
        When no PaymentGatewayConfig exists (NOT_CONFIGURED), resolver falls back to SystemConfig.
        """
        SystemConfig.objects.create(key="PAYPAL_CLIENT_ID", value="paypal_sys_client")
        SystemConfig.objects.create(key="PAYPAL_CLIENT_SECRET", value="paypal_sys_secret")
        SystemConfig.objects.create(key="PAYPAL_MODE", value="sandbox")

        config = PaymentGatewayConfigResolver.resolve_gateway("PAYPAL")
        self.assertEqual(config.source, "SYSTEM_DB")
        self.assertEqual(config.api_key, "paypal_sys_client")
        self.assertEqual(config.api_secret, "paypal_sys_secret")
        self.assertTrue(config.is_sandbox)

        adapter = PaymentGatewayAdapterFactory.get_adapter("PAYPAL")
        self.assertIsInstance(adapter, PayPalPaymentAdapter)
        self.assertEqual(adapter.client_id, "paypal_sys_client")
        self.assertEqual(adapter.client_secret, "paypal_sys_secret")

    def test_not_configured_domain_and_system_config_falls_back_to_env(self):
        """
        When neither PaymentGatewayConfig nor SystemConfig exist, resolver falls back to os.environ / settings.
        """
        with mock.patch.dict(os.environ, {
            "RAZORPAY_KEY_ID": "rzp_env_key_123",
            "RAZORPAY_KEY_SECRET": "rzp_env_secret_456",
        }):
            config = PaymentGatewayConfigResolver.resolve_gateway("RAZORPAY")
            self.assertEqual(config.source, "SETTINGS_ENV")
            self.assertEqual(config.api_key, "rzp_env_key_123")
            self.assertEqual(config.api_secret, "rzp_env_secret_456")

    def test_completely_unconfigured_gateway_raises_not_configured_error(self):
        """
        When no domain, system, or env config exists, resolver raises GatewayNotConfiguredError.
        API returns HTTP 503 SERVICE_UNAVAILABLE.
        """
        with self.assertRaises(GatewayNotConfiguredError):
            PaymentGatewayConfigResolver.resolve_gateway("RAZORPAY")

        res = self.client.post("/api/v1/payments/transactions/initiate/", {
            "customer_id": str(self.customer.id),
            "amount": "50.00",
            "currency": "USD",
            "gateway_type": "RAZORPAY",
        })
        self.assertEqual(res.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)

    def test_secret_redaction_in_resolved_config(self):
        """
        Ensures that __repr__ and __str__ mask sensitive keys and secrets.
        """
        PaymentGatewayConfig.objects.create(
            gateway_type="RAZORPAY",
            display_name="Razorpay Gateway",
            is_active=True,
            extra_config={
                "key_id": "rzp_live_abc123456789",
                "key_secret": "super_secret_password_xyz987",
            },
        )
        config = PaymentGatewayConfigResolver.resolve_gateway("RAZORPAY")
        repr_str = repr(config)
        str_str = str(config)

        # Plaintext secret must never appear in repr or str
        self.assertNotIn("super_secret_password_xyz987", repr_str)
        self.assertNotIn("super_secret_password_xyz987", str_str)
        # Masked output must be present
        self.assertIn("rzp_", repr_str)
        self.assertIn("89", repr_str)
        self.assertNotIn("abc1234567", repr_str)
        self.assertIn("***", repr_str)

    def test_cod_gateway_resolution(self):
        """
        COD gateway resolves with active status and default currencies.
        """
        config = PaymentGatewayConfigResolver.resolve_gateway("COD")
        self.assertEqual(config.gateway_type, "COD")
        self.assertTrue(config.is_active)
        self.assertFalse(config.is_sandbox)

    def test_multi_tenant_parameter_acceptance(self):
        """
        Resolver public signature accepts tenant_id without error.
        """
        SystemConfig.objects.create(key="RAZORPAY_KEY_ID", value="rzp_tenant_key")
        SystemConfig.objects.create(key="RAZORPAY_KEY_SECRET", value="rzp_tenant_secret")

        config = PaymentGatewayConfigResolver.resolve_gateway("RAZORPAY", tenant_id="tenant_store_01")
        self.assertEqual(config.api_key, "rzp_tenant_key")
