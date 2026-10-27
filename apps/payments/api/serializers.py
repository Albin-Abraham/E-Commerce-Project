from rest_framework import serializers

from apps.payments.health.models import PaymentGatewayHealth
from apps.payments.models import PaymentGatewayConfig, PaymentTransaction


class PaymentGatewayHealthSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentGatewayHealth
        fields = [
            "id",
            "gateway_type",
            "status",
            "configuration_status",
            "connectivity_status",
            "authentication_status",
            "readiness_status",
            "last_checked_at",
            "last_success_at",
            "latency_ms",
            "last_error_code",
            "last_error_message",
            "consecutive_failures",
            "details",
        ]


class PaymentGatewayConfigSerializer(serializers.ModelSerializer):
    health = PaymentGatewayHealthSerializer(read_only=True)

    class Meta:
        model = PaymentGatewayConfig
        fields = [
            "id",
            "gateway_type",
            "display_name",
            "is_active",
            "is_sandbox",
            "supported_currencies",
            "health",
        ]


class PaymentTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentTransaction
        fields = [
            "id",
            "transaction_code",
            "customer",
            "order",
            "gateway_type",
            "gateway_order_id",
            "gateway_payment_id",
            "amount",
            "currency",
            "status",
            "failure_reason",
            "created_at",
        ]


class InitiatePaymentRequestSerializer(serializers.Serializer):
    customer_id = serializers.CharField(required=True)
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, required=True)
    currency = serializers.CharField(default="USD")
    gateway_type = serializers.ChoiceField(choices=["RAZORPAY", "PAYPAL", "STRIPE", "COD"])
    order_id = serializers.CharField(required=False, allow_null=True)


class VerifyRazorpayPaymentSerializer(serializers.Serializer):
    transaction_id = serializers.CharField(required=True)
    razorpay_payment_id = serializers.CharField(required=True)
    razorpay_signature = serializers.CharField(required=True)


class CapturePayPalPaymentSerializer(serializers.Serializer):
    transaction_id = serializers.CharField(required=True)
    paypal_order_id = serializers.CharField(required=True)
