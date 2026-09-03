from rest_framework import status
from rest_framework.response import Response

from core.base_views.api_views import BaseAPIView
from core.admin.helpers.query_helpers import FilterSchema, FilterField
from apps.shop.infrastructure.models.warehouse import Warehouse
from apps.shop.infrastructure.models.inventory import Inventory
from apps.shop.infrastructure.serializers.shop_serializers import WarehouseSerializer, InventorySerializer


class WarehouseViewSet(BaseAPIView):
    model = Warehouse
    serializer_class = WarehouseSerializer
    entity_name = "Warehouse"
    view_id = "SHOP_WAREHOUSE_MGMT"

    search_fields = ["name", "code"]
    filter_schema = FilterSchema(
        name=FilterField(type=str, lookups=["exact", "icontains"]),
        code=FilterField(type=str, lookups=["exact"]),
        is_active=FilterField(type=bool),
    )


class InventoryViewSet(BaseAPIView):
    """
    Inventory Management & Atomic Reservation API ViewSet.
    Provides atomic reserve, release, and commit endpoints for checkout integrity.
    """
    model = Inventory
    serializer_class = InventorySerializer
    entity_name = "Inventory"
    view_id = "SHOP_INVENTORY_MGMT"

    paginate = True
    filter_schema = FilterSchema(
        variant=FilterField(type=str, lookups=["exact"]),
        product=FilterField(type=str, lookups=["exact"]),
        warehouse=FilterField(type=str, lookups=["exact"]),
        quantity=FilterField(type=int, lookups=["exact", "gte", "lte"]),
    )

    def get_base_queryset(self):
        return Inventory.objects.select_related("variant", "product", "warehouse", "branch")

    def post(self, request, *args, **kwargs):
        """
        Custom POST endpoint handling standard creation as well as custom action routes:
        - action='reserve': Atomic stock reservation
        - action='release': Release stock reservation
        - action='commit': Fulfill and deduct stock
        """
        action = request.data.get("action")
        inventory_id = request.data.get("inventory_id") or kwargs.get("pk")
        qty = request.data.get("quantity", 0)

        if action == "reserve":
            try:
                Inventory.reserve_stock(inventory_id, int(qty))
                return Response(
                    {"status": "success", "message": f"Successfully reserved {qty} units"},
                    status=status.HTTP_200_OK,
                )
            except Exception as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        elif action == "release":
            success = Inventory.release_stock(inventory_id, int(qty))
            if success:
                return Response({"status": "success", "message": f"Released {qty} units"}, status=status.HTTP_200_OK)
            return Response({"error": "Failed to release stock"}, status=status.HTTP_400_BAD_REQUEST)

        elif action == "commit":
            success = Inventory.commit_stock(inventory_id, int(qty))
            if success:
                return Response({"status": "success", "message": f"Committed {qty} units"}, status=status.HTTP_200_OK)
            return Response({"error": "Failed to commit stock"}, status=status.HTTP_400_BAD_REQUEST)

        return super().post(request, *args, **kwargs)
