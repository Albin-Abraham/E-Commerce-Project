from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
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
from apps.payments.configuration.exceptions import (
    GatewayDisabledError,
    GatewayNotConfiguredError,
    GatewayConfigurationError,
)


from apps.payments.health.service import PaymentGatewayHealthMonitorService
from apps.payments.health.models import PaymentGatewayHealth
from apps.payments.api.serializers import PaymentGatewayHealthSerializer


class PaymentGatewayConfigViewSet(viewsets.ModelViewSet):
    queryset = PaymentGatewayConfig.objects.all()
    serializer_class = PaymentGatewayConfigSerializer
    permission_classes = [AllowAny]

    @action(detail=True, methods=["post"], url_path="health-check")
    def health_check(self, request, pk=None):
        """
        On-demand manual health check ('Test Connection') for administrators.
        Runs full 4-tier health check pipeline and returns diagnostic results.
        """
        config = self.get_object()
        result = PaymentGatewayHealthMonitorService.check_gateway_health(config.gateway_type, persist=True)
        return ResponseFactory.success(
            data=result.to_dict(),
            message=f"Health check completed for '{config.gateway_type}': {result.overall_status}",
        )

    @action(detail=True, methods=["get"], url_path="health")
    def get_health(self, request, pk=None):
        """
        Retrieves the latest persisted health assessment for this gateway.
        """
        config = self.get_object()
        health = getattr(config, "health", None)
        if not health:
            health = PaymentGatewayHealth.objects.filter(gateway_type=config.gateway_type).first()

        if not health:
            result = PaymentGatewayHealthMonitorService.check_gateway_health(config.gateway_type, persist=True)
            return ResponseFactory.success(
                data=result.to_dict(),
                message=f"Initial health check completed for '{config.gateway_type}'",
            )

        return ResponseFactory.success(
            data=PaymentGatewayHealthSerializer(health).data,
            message=f"Retrieved health status for '{config.gateway_type}'",
        )

    @action(detail=True, methods=["post"], url_path="activate")
    def activate(self, request, pk=None):
        """
        Activates the payment gateway after configuration validation.
        """
        config = self.get_object()
        config.is_active = True
        config.save(update_fields=["is_active", "updated_at"])
        PaymentGatewayHealthMonitorService.check_gateway_health(config.gateway_type, persist=True)
        return ResponseFactory.success(
            data=PaymentGatewayConfigSerializer(config).data,
            message=f"Payment gateway '{config.gateway_type}' activated successfully.",
        )

    @action(detail=True, methods=["post"], url_path="deactivate")
    def deactivate(self, request, pk=None):
        """
        Deactivates the payment gateway and marks health as DISABLED.
        """
        config = self.get_object()
        config.is_active = False
        config.save(update_fields=["is_active", "updated_at"])
        PaymentGatewayHealthMonitorService.check_gateway_health(config.gateway_type, persist=True)
        return ResponseFactory.success(
            data=PaymentGatewayConfigSerializer(config).data,
            message=f"Payment gateway '{config.gateway_type}' deactivated successfully.",
        )


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
        except GatewayDisabledError as exc:
            return ResponseFactory.error(message=str(exc), status_code=status.HTTP_409_CONFLICT)
        except (GatewayNotConfiguredError, GatewayConfigurationError) as exc:
            return ResponseFactory.error(message=str(exc), status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
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
    permission_classes = [AllowAny]

    @action(detail=False, methods=["post"], url_path="initiate", permission_classes=[AllowAny])
    def initiate_payment(self, request):
        resp = PaymentInitiateWorkflowAPIView().post(request)
        if resp.status_code == status.HTTP_201_CREATED and isinstance(resp.data, dict) and "data" in resp.data:
            from rest_framework.response import Response
            return Response(resp.data["data"], status=status.HTTP_201_CREATED)
        return resp


    @action(detail=False, methods=["post"], url_path="verify-razorpay", permission_classes=[AllowAny])
    def verify_razorpay(self, request):
        return PaymentRazorpayVerifyWorkflowAPIView().post(request)

    @action(detail=False, methods=["post"], url_path="capture-paypal", permission_classes=[AllowAny])
    def capture_paypal(self, request):
        return PaymentPayPalCaptureWorkflowAPIView().post(request)
