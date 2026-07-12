# core/admin/services/company_service.py
from core.admin.models.company import Company
from .base_service import BaseService
from .audit_service import AuditService
from core.admin.tasks.tenant_tasks import initialize_company_defaults
from django.db import transaction
from typing import Any

class CompanyService(BaseService[Company]):
    """
    Service to manage Companies and their lifecycle.
    Integrates with background provisioning and auditing.
    """
    model = Company

    @classmethod
    @transaction.atomic
    def create_with_provisioning(cls, user=None, **data) -> Company:
        """
        Creates a company and triggers automated provisioning tasks.
        """
        # Create via BaseService (Injects context and handles full_clean)
        company = cls.create(user=user, **data)
        
        # Trigger Provisioning after commit
        transaction.on_commit(
            lambda: initialize_company_defaults.delay(company.id)
        )
        
        return company

    @classmethod
    def get_audit_summary(cls, company_id: Any) -> dict:
        """
        Returns a high-level audit summary for a specific company.
        """
        company = cls.model.objects.filter(pk=company_id).first()
        if not company:
            return {"error": "Company not found"}
            
        return AuditService.summarize_changes(company)
