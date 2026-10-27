from apps.procurement_pos.models.pos import POSRegister, POSSession, POSTransaction
from apps.procurement_pos.serializers import (
    POSRegisterSerializer,
    POSSessionSerializer,
    POSTransactionSerializer,
)
from core.admin.helpers.query_helpers import FilterField, FilterSchema
from core.base_views.api_views import BaseAPIView


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
        return POSTransaction.objects.select_related("session", "customer").prefetch_related(
            "items"
        )


from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.shop.application.services.product_knowledge_service import ProductKnowledgeService
from apps.shop.infrastructure.models.inventory import Inventory
from apps.shop.infrastructure.models.variant import ProductVariant


class POSProductLookupView(APIView):
    """
    POS Product & Cashier Pitch Lookup API.
    Resolves barcode or SKU against a register's assigned warehouse.
    Returns:
      - Product Variant metadata & authoritative price
      - Warehouse-specific available stock
      - Active cashier sales pitches (CASHIER_PITCH) and spec sheets from ProductKnowledgeService
    """

    def get(self, request, register_id=None, *args, **kwargs):
        register = get_object_or_404(
            POSRegister.objects.select_related("warehouse"), pk=register_id
        )
        barcode = request.query_params.get("barcode")
        sku = request.query_params.get("sku")

        if not barcode and not sku:
            return Response(
                {"error": "Please provide a 'barcode' or 'sku' query parameter."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        variant = None
        if barcode:
            variant = (
                ProductVariant.objects.select_related("product").filter(barcode=barcode).first()
            )
        if not variant and sku:
            variant = ProductVariant.objects.select_related("product").filter(sku=sku).first()

        if not variant:
            return Response(
                {"error": f"No product variant found matching barcode '{barcode}' or sku '{sku}'."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Check warehouse stock
        available_qty = 0
        warehouse_data = None
        if register.warehouse:
            inv = Inventory.objects.filter(variant=variant, warehouse=register.warehouse).first()
            if inv:
                available_qty = inv.available_quantity
            warehouse_data = {
                "warehouse_id": str(register.warehouse.id),
                "warehouse_name": register.warehouse.name,
                "available_quantity": available_qty,
            }

        # Knowledge Base Enrichment (Cashier Pitches & Specs)
        cashier_pitches = []
        specifications = {}
        try:
            kb_data = ProductKnowledgeService.resolve_knowledge_content(variant)
            raw_pitches = kb_data.get("cashier_pitches", [])
            for p in raw_pitches:
                if isinstance(p, dict) and "content" in p:
                    cashier_pitches.append(p["content"])
                elif isinstance(p, str):
                    cashier_pitches.append(p)
            specifications = kb_data.get("specifications", {})
        except Exception:
            # Graceful degradation if KB service encounters errors
            pass

        return Response(
            {
                "variant_id": str(variant.id),
                "sku": variant.sku,
                "product_name": variant.product.name if variant.product else "",
                "barcode": variant.barcode or "",
                "unit_price": str(variant.price),
                "warehouse_stock": warehouse_data,
                "cashier_pitches": cashier_pitches,
                "specifications": specifications,
            },
            status=status.HTTP_200_OK,
        )
