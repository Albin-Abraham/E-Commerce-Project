# core/admin/views/branch_views.py
from core.admin.models.branch import Branch
from core.admin.serializers.branch_serializers import BranchSerializer
from core.base_views.api_views import BaseAPIView


class BranchViewSet(BaseAPIView):
    """
    Industrialized API ViewSet for Branch management.
    Handles multi-tenant scoping and validation automatically.
    """

    model = Branch
    serializer_class = BranchSerializer
    entity_name = "Branch"
