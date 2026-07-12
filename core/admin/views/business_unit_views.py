from core.base_views.api_views import BaseAPIView
from core.admin.models.business_unit import BusinessUnit
from core.admin.serializers.business_unit_serializers import BusinessUnitSerializer

class BusinessUnitAPIView(BaseAPIView):
    """
    Industrialized Business Unit API.
    Handles CRUD operations with TenantModelMixin scope.
    """
    model = BusinessUnit
    serializer_class = BusinessUnitSerializer
    
    # Enable full auditing
    audit_enabled = True
    
    # Map actions to system permissions
    permission_keys = {
        "GET": "business_unit:view",
        "POST": "business_unit:create",
        "PATCH": "business_unit:edit",
        "DELETE": "business_unit:delete",
    }
