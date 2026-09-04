from rest_framework import status
from rest_framework.response import Response

from core.base_views.api_views import BaseAPIView
from core.admin.helpers.query_helpers import FilterSchema, FilterField
from apps.shop.infrastructure.models.warehouse import Warehouse
from apps.shop.infrastructure.models.inventory import Inventory
from apps.shop.infrastructure.serializers.shop_serializers import WarehouseSerializer, InventorySerializer


from core.admin.helpers.response_helpers import ResponseFactory


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
                return ResponseFactory.success(
                    message="Successfully reserved {reserved_unit} units",
                    context={"reserved_unit": int(qty), "inventory_id": inventory_id},
                )
            except Exception as e:
                return ResponseFactory.error(message=str(e))

        elif action == "release":
            success = Inventory.release_stock(inventory_id, int(qty))
            if success:
                return ResponseFactory.success(
                    message="Released {released_unit} units",
                    context={"released_unit": int(qty), "inventory_id": inventory_id},
                )
            return ResponseFactory.error(message="Failed to release stock")

        elif action == "commit":
            success = Inventory.commit_stock(inventory_id, int(qty))
            if success:
                return ResponseFactory.success(
                    message="Committed {committed_unit} units",
                    context={"committed_unit": int(qty), "inventory_id": inventory_id},
                )
            return ResponseFactory.error(message="Failed to commit stock")

        return super().post(request, *args, **kwargs)
