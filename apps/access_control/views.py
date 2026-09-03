from datetime import datetime
from apps.access_control.models import FieldAccessPolicy, PolicyConfiguration
from apps.access_control.serializers import (
    FieldAccessPolicySerializer,
    PolicyConfigurationSerializer,
)
from core.base_views.api_views import BaseAPIView
from core.admin.helpers.query_helpers import FilterSchema, FilterField


class FieldAccessPolicyAPIView(BaseAPIView):
    """
    API View for managing Field Access Policies.
    Provides standard GET, POST, PUT, DELETE operations automatically with DB-level declarative filtering.
    """

    model = FieldAccessPolicy
    serializer_class = FieldAccessPolicySerializer
    entity_name = "Field Access Policy"
    paginate = True
    supports_soft_delete = False

    search_fields = ["name", "field_name"]
    filter_fields = [("name", "name"), ("is_active", "is_active")]
    filter_schema = FilterSchema(
        name=FilterField(type=str, lookups=["exact", "icontains"]),
        field_name=FilterField(type=str, lookups=["exact", "icontains"]),
        is_active=FilterField(type=bool),
        created_at=FilterField(type=datetime, lookups=["exact", "gte", "lte"]),
    )
    orderby = "name"


class PolicyConfigurationAPIView(BaseAPIView):
    """
    API View for managing versioned Policy Configurations.
    Provides standard GET, POST, PUT, DELETE operations automatically with DB-level declarative filtering.
    """

    model = PolicyConfiguration
    serializer_class = PolicyConfigurationSerializer
    entity_name = "Policy Configuration"
    paginate = True
    supports_soft_delete = False

    filter_fields = [("status", "status"), ("version", "version"), ("action", "action")]
    filter_schema = FilterSchema(
        status=FilterField(type=str, lookups=["exact"]),
        version=FilterField(type=int, lookups=["exact", "gte", "lte"]),
        action=FilterField(type=str, lookups=["exact"]),
        effect=FilterField(type=str, lookups=["exact"]),
        created_at=FilterField(type=datetime, lookups=["exact", "gte", "lte"]),
    )
    orderby = "-version"
