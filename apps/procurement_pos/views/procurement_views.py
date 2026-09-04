from django.core.exceptions import ValidationError
from rest_framework import status

from core.base_views.api_views import BaseAPIView
from core.admin.helpers.query_helpers import FilterSchema, FilterField
from core.admin.helpers.response_helpers import ResponseFactory
from apps.procurement_pos.models.procurement import Supplier, PurchaseOrder, GoodsReceivedNote
from apps.procurement_pos.serializers import (
    SupplierSerializer,
    PurchaseOrderSerializer,
    GoodsReceivedNoteSerializer,
)
from apps.procurement_pos.workflows.purchase_order_workflow import PurchaseOrderWorkflow
from apps.procurement_pos.workflows.grn_workflow import GRNWorkflow


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
    """
    Purchase Order API ViewSet.
    Supports state machine actions (submit, approve, cancel) via workflows and ResponseFactory.
    """
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

    def post(self, request, *args, **kwargs):
        action = request.data.get("action")
        po_id = request.data.get("po_id") or kwargs.get("pk")

        if action in ["submit", "approve", "cancel"]:
            try:
                if action == "submit":
                    po = PurchaseOrderWorkflow.submit_po(po_id, request.user)
                    msg = f"Purchase Order #{po.po_number} submitted successfully."
                elif action == "approve":
                    po = PurchaseOrderWorkflow.approve_po(po_id, request.user)
                    msg = f"Purchase Order #{po.po_number} approved successfully."
                elif action == "cancel":
                    reason = request.data.get("reason", "")
                    po = PurchaseOrderWorkflow.cancel_po(po_id, request.user, reason=reason)
                    msg = f"Purchase Order #{po.po_number} cancelled successfully."

                serializer = self.serializer_class(po)
                return ResponseFactory.success(data=serializer.data, message=msg)

            except ValidationError as e:
                return ResponseFactory.validation_error(errors={"detail": str(e)})
            except Exception as e:
                return ResponseFactory.error(message=str(e), status_code=status.HTTP_400_BAD_REQUEST)

        return super().post(request, *args, **kwargs)


class GoodsReceivedNoteViewSet(BaseAPIView):
    """
    GRN API ViewSet.
    Includes custom action 'finalize' to complete GRN and update Inventory stock dynamically via GRNWorkflow.
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
                grn = GRNWorkflow.process_and_receive(grn_id, request.user)
                serializer = self.serializer_class(grn)
                return ResponseFactory.success(
                    data=serializer.data,
                    message="GRN processed and inventory stock updated successfully."
                )
            except ValidationError as e:
                return ResponseFactory.validation_error(errors={"detail": str(e)})
            except Exception as e:
                return ResponseFactory.error(message=str(e), status_code=status.HTTP_400_BAD_REQUEST)

        return super().post(request, *args, **kwargs)
