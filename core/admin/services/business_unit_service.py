# core/admin/services/business_unit_service.py
from core.admin.models.business_unit import BusinessUnit
from .base_service import BaseService

class BusinessUnitService(BaseService[BusinessUnit]):
    """
    Service to manage Business Units.
    Inherits create, update, delete, and get_queryset from BaseService.
    """
    model = BusinessUnit
