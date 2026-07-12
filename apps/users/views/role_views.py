from datetime import datetime
from core.base_views.api_views import BaseAPIView
from core.admin.helpers.query_helpers import FilterSchema, FilterField
from apps.users.models.permissions import RolePermissions
from apps.users.serializers.role_serializers import (
    RoleListSerializer,
    RoleDetailSerializer,
    RoleCreateSerializer,
)


class RoleViewSet(BaseAPIView):
    model = RolePermissions
    entity_name = "Role"
    view_id = "ROLE_MANAGEMENT"

    paginate = True
    supports_soft_delete = False

    search_fields = ["name", "description"]
    filter_fields = [("name", "name")]
    filter_schema = FilterSchema(
        name=FilterField(type=str, lookups=["exact", "icontains"]),
        description=FilterField(type=str, lookups=["icontains"]),
        created_at=FilterField(type=datetime, lookups=["exact", "gte", "lte"]),
    )
    orderby = "name"

    list_serializer_class = RoleListSerializer
    detail_serializer_class = RoleDetailSerializer
    create_serializer_class = RoleCreateSerializer
    update_serializer_class = RoleDetailSerializer
