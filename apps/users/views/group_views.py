from datetime import datetime

from rest_framework.permissions import IsAdminUser

from apps.users.models.permissions import RoleGroupPermissions
from apps.users.serializers.group_serializers import (
    GroupCreateSerializer,
    GroupDetailSerializer,
    GroupListSerializer,
)
from core.admin.helpers.query_helpers import FilterField, FilterSchema
from core.base_views.api_views import BaseAPIView


class GroupViewSet(BaseAPIView):
    model = RoleGroupPermissions
    entity_name = "RoleGroup"
    view_id = "GROUP_MANAGEMENT"
    permission_classes = [IsAdminUser]

    paginate = True
    supports_soft_delete = False

    search_fields = ["name"]
    filter_fields = [("name", "name")]
    filter_schema = FilterSchema(
        name=FilterField(type=str, lookups=["exact", "icontains"]),
        created_at=FilterField(type=datetime, lookups=["exact", "gte", "lte"]),
    )
    orderby = "name"

    list_serializer_class = GroupListSerializer
    detail_serializer_class = GroupDetailSerializer
    create_serializer_class = GroupCreateSerializer
    update_serializer_class = GroupDetailSerializer
