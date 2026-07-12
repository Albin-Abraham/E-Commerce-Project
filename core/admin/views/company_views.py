# core/admin/views/company_views.py
from core.base_views.api_views import BaseAPIView
from core.admin.models.company import Company
from core.admin.serializers.company_serializers import CompanySerializer
from rest_framework.permissions import AllowAny

class CompanyViewSet(BaseAPIView):
    """
    API ViewSet for Company management.
    Handles CRUD with GoF Domain Validation and Soft Deletes.
    """
    model = Company
    serializer_class = CompanySerializer
    entity_name = "Company"
    view_id = "CORE_COMPANY_MGMT"


    permission_classes = [AllowAny]
    
    # Industrialized Features
    paginate = True
    supports_soft_delete = True
    allow_export = True
    
    # Search and Filter Configuration
    search_fields = ["name", "code", "email"]
    filter_fields = [
        "code", 
        "name",
        "email"
    ]
    orderby = "name"
