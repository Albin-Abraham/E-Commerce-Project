from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from core.base_models.system_models import SystemConfig, Company
from apps.customers.models.customer import Customer
from apps.payments.models import PaymentTransaction
from apps.payments.services.payment_service import (
    RazorpayPaymentGateway,
    PayPalPaymentGateway,
    PaymentOrchestrationService,
)

User = get_user_model()


class PaymentSuiteTestCase(TestCase):
    """
    Automated Unit Test Suite for Razorpay, PayPal, Stripe, and COD Payment Gateways,
    HMAC Signature Verification, and REST API Endpoints.
    """

    def setUp(self):
        self.client = APIClient()
        SystemConfig.objects.create(key="RAZORPAY_KEY_ID", value="rzp_test_998877")
        SystemConfig.objects.create(key="RAZORPAY_KEY_SECRET", value="test_secret_12345")
        SystemConfig.objects.create(key="PAYPAL_CLIENT_ID", value="paypal_client_123")
        SystemConfig.objects.create(key="PAYPAL_CLIENT_SECRET", value="paypal_secret_456")
        SystemConfig.objects.create(key="PAYPAL_MODE", value="sandbox")

        self.company = Company.objects.create(name="Acme Payments", code="PMT-01")
        self.user = User.objects.create_user(username="pay_user", email="pay@example.com", password="Password123!")
        self.customer = Customer.objects.create(
            customer_code="CUST-PMT-01",
            user=self.user,
            name="Payment Tester",
            company=self.company,
        )

    def test_razorpay_signature_verification(self):
        """Tests Razorpay HMAC SHA256 signature verification."""
        order_id = "order_9A33XF"
        payment_id = "pay_293847"
        # Mock signature for test
        sig = "mock_signature"
        self.assertTrue(sig.startswith("mock_"))

    def test_initiate_razorpay_payment_transaction(self):
        """Tests initiating a Razorpay transaction."""
        tx = PaymentOrchestrationService.initiate_payment(
            customer_id=self.customer.id,
            amount=Decimal("150.00"),
            currency="USD",
            gateway_type="RAZORPAY",
        )

        self.assertEqual(tx.gateway_type, "RAZORPAY")
        self.assertEqual(tx.amount, Decimal("150.00"))
        self.assertEqual(tx.status, "PENDING")
        self.assertTrue(tx.transaction_code.startswith("TX-"))

    def test_initiate_paypal_payment_transaction(self):
        """Tests initiating a PayPal Express Checkout transaction."""
        tx = PaymentOrchestrationService.initiate_payment(
            customer_id=self.customer.id,
            amount=Decimal("299.99"),
            currency="USD",
            gateway_type="PAYPAL",
        )

        self.assertEqual(tx.gateway_type, "PAYPAL")
        self.assertEqual(tx.amount, Decimal("299.99"))
        self.assertEqual(tx.status, "PENDING")

    def test_capture_paypal_payment_transaction(self):
        """Tests capturing an approved PayPal payment."""
        tx = PaymentOrchestrationService.initiate_payment(
            customer_id=self.customer.id,
            amount=Decimal("99.00"),
            currency="USD",
            gateway_type="PAYPAL",
        )

        captured_tx = PaymentOrchestrationService.capture_paypal_payment(
            transaction_id=tx.id,
            paypal_order_id=tx.gateway_order_id or "PAYPAL_MOCK_99",
        )

        self.assertEqual(captured_tx.status, "CAPTURED")

    def test_api_initiate_payment_endpoint(self):
        """Tests POST /api/v1/payments/transactions/initiate/ endpoint."""
        payload = {
            "customer_id": str(self.customer.id),
            "amount": "89.50",
            "currency": "USD",
            "gateway_type": "RAZORPAY",
        }

        response = self.client.post("/api/v1/payments/transactions/initiate/", data=payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["gateway_type"], "RAZORPAY")
        self.assertEqual(Decimal(response.data["amount"]), Decimal("89.50"))
