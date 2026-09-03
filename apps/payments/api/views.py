from rest_framework import viewsets, status
from rest_framework.decorators import action
from core.base_views.api_views import BaseAPIView
from core.admin.helpers.response_helpers import ResponseFactory
from apps.payments.models import PaymentTransaction, PaymentGatewayConfig
from apps.payments.api.serializers import (
    PaymentTransactionSerializer,
    PaymentGatewayConfigSerializer,
    InitiatePaymentRequestSerializer,
    VerifyRazorpayPaymentSerializer,
    CapturePayPalPaymentSerializer,
)
from apps.payments.services.payment_service import PaymentOrchestrationService


class PaymentGatewayConfigViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = PaymentGatewayConfig.objects.filter(is_active=True)
    serializer_class = PaymentGatewayConfigSerializer


class PaymentInitiateWorkflowAPIView(BaseAPIView):
    """
    Workflow API View inheriting from BaseAPIView.
    Processes payment initiation workflows across Razorpay, PayPal, Stripe, and COD.
    """
    model = PaymentTransaction
    serializer_class = PaymentTransactionSerializer

    def post(self, request, *args, **kwargs):
        serializer = InitiatePaymentRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return ResponseFactory.validation_error(serializer.errors)

        data = serializer.validated_data
        try:
            tx = PaymentOrchestrationService.initiate_payment(
                customer_id=data["customer_id"],
                amount=data["amount"],
                currency=data.get("currency", "USD"),
                gateway_type=data["gateway_type"],
                order_id=data.get("order_id"),
            )
            return ResponseFactory.created(
                data=PaymentTransactionSerializer(tx).data,
                message="Payment transaction initiated successfully via workflow engine",
            )
        except ValueError as exc:
            return ResponseFactory.error(message=str(exc), status_code=status.HTTP_400_BAD_REQUEST)


class PaymentRazorpayVerifyWorkflowAPIView(BaseAPIView):
    """
    Workflow API View inheriting from BaseAPIView.
    Verifies Razorpay HMAC signature and captures payment.
    """
    model = PaymentTransaction
    serializer_class = PaymentTransactionSerializer

    def post(self, request, *args, **kwargs):
        serializer = VerifyRazorpayPaymentSerializer(data=request.data)
        if not serializer.is_valid():
            return ResponseFactory.validation_error(serializer.errors)

        data = serializer.validated_data
        try:
            tx = PaymentOrchestrationService.verify_and_capture_razorpay(
                transaction_id=data["transaction_id"],
                razorpay_payment_id=data["razorpay_payment_id"],
                razorpay_signature=data["razorpay_signature"],
            )
            return ResponseFactory.success(
                data=PaymentTransactionSerializer(tx).data,
                message="Razorpay payment signature verified and captured via workflow engine",
            )
        except ValueError as exc:
            return ResponseFactory.error(message=str(exc), status_code=status.HTTP_400_BAD_REQUEST)


class PaymentPayPalCaptureWorkflowAPIView(BaseAPIView):
    """
    Workflow API View inheriting from BaseAPIView.
    Captures approved PayPal payment transaction.
    """
    model = PaymentTransaction
    serializer_class = PaymentTransactionSerializer

    def post(self, request, *args, **kwargs):
        serializer = CapturePayPalPaymentSerializer(data=request.data)
        if not serializer.is_valid():
            return ResponseFactory.validation_error(serializer.errors)

        data = serializer.validated_data
        try:
            tx = PaymentOrchestrationService.capture_paypal_payment(
                transaction_id=data["transaction_id"],
                paypal_order_id=data["paypal_order_id"],
            )
            return ResponseFactory.success(
                data=PaymentTransactionSerializer(tx).data,
                message="PayPal payment captured successfully via workflow engine",
            )
        except ValueError as exc:
            return ResponseFactory.error(message=str(exc), status_code=status.HTTP_400_BAD_REQUEST)


class PaymentTransactionViewSet(viewsets.ModelViewSet):
    queryset = PaymentTransaction.objects.all()
    serializer_class = PaymentTransactionSerializer

    @action(detail=False, methods=["post"], url_path="initiate")
    def initiate_payment(self, request):
        return PaymentInitiateWorkflowAPIView().post(request)

    @action(detail=False, methods=["post"], url_path="verify-razorpay")
    def verify_razorpay(self, request):
        return PaymentRazorpayVerifyWorkflowAPIView().post(request)

    @action(detail=False, methods=["post"], url_path="capture-paypal")
    def capture_paypal(self, request):
        return PaymentPayPalCaptureWorkflowAPIView().post(request)
