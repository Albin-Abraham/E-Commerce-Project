from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.payments.api.views import PaymentGatewayConfigViewSet, PaymentTransactionViewSet

router = DefaultRouter()
router.register(r"gateways", PaymentGatewayConfigViewSet, basename="payment-gateways")
router.register(r"transactions", PaymentTransactionViewSet, basename="payment-transactions")

urlpatterns = [
    path("", include(router.urls)),
]
