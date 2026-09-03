from rest_framework import serializers
from apps.payments.models import PaymentTransaction, PaymentGatewayConfig, PaymentRefund


class PaymentGatewayConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentGatewayConfig
        fields = [
            "id",
            "gateway_type",
            "display_name",
            "is_active",
            "is_sandbox",
            "supported_currencies",
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
