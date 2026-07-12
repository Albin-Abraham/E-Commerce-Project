# core/admin/services/branch_service.py
from core.admin.models.branch import Branch
from .base_service import BaseService

class BranchService(BaseService[Branch]):
    """
    Service to manage Branches.
    Inherits standard CRUD and tenant-scoping from BaseService.
    """
    model = Branch
