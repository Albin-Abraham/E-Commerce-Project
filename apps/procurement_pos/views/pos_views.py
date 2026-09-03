from core.base_views.api_views import BaseAPIView
from core.admin.helpers.query_helpers import FilterSchema, FilterField
from apps.procurement_pos.models.pos import POSRegister, POSSession, POSTransaction
from apps.procurement_pos.serializers import (
    POSRegisterSerializer,
    POSSessionSerializer,
    POSTransactionSerializer,
)


class POSRegisterViewSet(BaseAPIView):
    model = POSRegister
    serializer_class = POSRegisterSerializer
    entity_name = "POSRegister"
    view_id = "POS_REGISTER_MGMT"

    search_fields = ["name", "code"]
    filter_schema = FilterSchema(
        name=FilterField(type=str, lookups=["exact", "icontains"]),
        code=FilterField(type=str, lookups=["exact"]),
        is_active=FilterField(type=bool),
        warehouse=FilterField(type=str, lookups=["exact"]),
    )


class POSSessionViewSet(BaseAPIView):
    model = POSSession
    serializer_class = POSSessionSerializer
    entity_name = "POSSession"
    view_id = "POS_SESSION_MGMT"

    paginate = True
    filter_schema = FilterSchema(
        register=FilterField(type=str, lookups=["exact"]),
        cashier=FilterField(type=str, lookups=["exact"]),
        status=FilterField(type=str, lookups=["exact"]),
    )

    def get_base_queryset(self):
        return POSSession.objects.select_related("register", "cashier")


class POSTransactionViewSet(BaseAPIView):
    """
    POS Checkout Transaction API ViewSet.
    """
    model = POSTransaction
    serializer_class = POSTransactionSerializer
    entity_name = "POSTransaction"
    view_id = "POS_TRANSACTION_MGMT"

    paginate = True
    search_fields = ["transaction_number"]
    filter_schema = FilterSchema(
        transaction_number=FilterField(type=str, lookups=["exact", "icontains"]),
        session=FilterField(type=str, lookups=["exact"]),
        payment_method=FilterField(type=str, lookups=["exact"]),
        status=FilterField(type=str, lookups=["exact"]),
        total_amount=FilterField(type=float, lookups=["exact", "gte", "lte"]),
    )

    def get_base_queryset(self):
        return POSTransaction.objects.select_related("session", "customer").prefetch_related("items")
