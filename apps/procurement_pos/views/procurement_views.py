from rest_framework import status
from rest_framework.response import Response

from core.base_views.api_views import BaseAPIView
from core.admin.helpers.query_helpers import FilterSchema, FilterField
from apps.procurement_pos.models.procurement import Supplier, PurchaseOrder, GoodsReceivedNote
from apps.procurement_pos.serializers import (
    SupplierSerializer,
    PurchaseOrderSerializer,
    GoodsReceivedNoteSerializer,
)


class SupplierViewSet(BaseAPIView):
    model = Supplier
    serializer_class = SupplierSerializer
    entity_name = "Supplier"
    view_id = "PROCUREMENT_SUPPLIER_MGMT"

    search_fields = ["name", "code", "tax_id"]
    filter_schema = FilterSchema(
        name=FilterField(type=str, lookups=["exact", "icontains"]),
        code=FilterField(type=str, lookups=["exact"]),
        is_active=FilterField(type=bool),
    )


class PurchaseOrderViewSet(BaseAPIView):
    model = PurchaseOrder
    serializer_class = PurchaseOrderSerializer
    entity_name = "PurchaseOrder"
    view_id = "PROCUREMENT_PO_MGMT"

    paginate = True
    search_fields = ["po_number"]
    filter_schema = FilterSchema(
        po_number=FilterField(type=str, lookups=["exact", "icontains"]),
        supplier=FilterField(type=str, lookups=["exact"]),
        status=FilterField(type=str, lookups=["exact"]),
        total_amount=FilterField(type=float, lookups=["exact", "gte", "lte"]),
    )

    def get_base_queryset(self):
        return PurchaseOrder.objects.select_related("supplier", "created_by").prefetch_related("items")


class GoodsReceivedNoteViewSet(BaseAPIView):
    """
    GRN API ViewSet.
    Includes custom action 'finalize' to complete GRN and update Inventory stock dynamically!
    """
    model = GoodsReceivedNote
    serializer_class = GoodsReceivedNoteSerializer
    entity_name = "GoodsReceivedNote"
    view_id = "PROCUREMENT_GRN_MGMT"

    filter_schema = FilterSchema(
        grn_number=FilterField(type=str, lookups=["exact"]),
        purchase_order=FilterField(type=str, lookups=["exact"]),
        warehouse=FilterField(type=str, lookups=["exact"]),
        status=FilterField(type=str, lookups=["exact"]),
    )

    def get_base_queryset(self):
        return GoodsReceivedNote.objects.select_related("purchase_order", "warehouse", "received_by")

    def post(self, request, *args, **kwargs):
        action = request.data.get("action")
        grn_id = request.data.get("grn_id") or kwargs.get("pk")

        if action == "finalize":
            try:
                grn = GoodsReceivedNote.process_grn_receipt(grn_id)
                serializer = self.serializer_class(grn)
                return Response(
                    {"status": "success", "message": "GRN processed and inventory stock updated.", "data": serializer.data},
                    status=status.HTTP_200_OK,
                )
            except Exception as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return super().post(request, *args, **kwargs)
