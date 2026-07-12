# core/session/context.py
from typing import Optional, Union
from django.http import HttpRequest
from uuid import UUID

class SessionContext:
    """
    Industrialized Session Manager for Multi-Tenant Context.
    Supports 3-tier hierarchy: Company -> Business Unit -> Branch.
    """
    COMPANY_KEY = "tenant_company_id"
    BUSINESS_UNIT_KEY = "tenant_business_unit_id"
    BRANCH_KEY = "tenant_branch_id"

    @classmethod
    def _validate_hierarchy(cls, request: HttpRequest, company_id: Optional[Union[str, UUID]] = None, business_unit_id: Optional[Union[str, UUID]] = None, branch_id: Optional[Union[str, UUID]] = None):
        """Validates that the provided tenant hierarchy actually exists and is structurally linked."""
        from core.base_models.exceptions import DomainException
        
        is_super = getattr(request.user, "is_superuser", False)
        
        # 1. Validate Company
        if company_id:
            from core.admin.models.company import Company
            if not Company.objects.filter(id=company_id).exists():
                raise DomainException(f"Company {company_id} does not exist.", code="invalid_company")
                
            if not is_super:
                from django.contrib.contenttypes.models import ContentType
                from apps.access_control.models import EntityAccessControl
                company_ct = ContentType.objects.get_for_model(Company)
                
                # Fallback to Profile check for legacy 1-to-1, or check Master ACL
                has_acl = EntityAccessControl.objects.filter(user=request.user, content_type=company_ct, object_id=str(company_id)).exists()
                if not has_acl and getattr(request.user, "profile", None):
                    has_acl = (request.user.profile.company_id == str(company_id))
                if not has_acl:
                    raise DomainException("You do not have authorization to access this Company.", code="unauthorized_company")
                
        # 2. Validate Business Unit (Must belong to Company)
        if business_unit_id:
            from core.admin.models.business_unit import BusinessUnit
            bu_qs = BusinessUnit.objects.filter(id=business_unit_id)
            if company_id:
                bu_qs = bu_qs.filter(company_id=company_id)
            if not bu_qs.exists():
                raise DomainException(f"Business Unit {business_unit_id} is invalid or does not belong to the selected Company.", code="invalid_business_unit")

        # 3. Validate Branch (Must belong to Business Unit)
        if branch_id:
            from core.admin.models.branch import Branch
            branch_qs = Branch.objects.filter(id=branch_id)
            if business_unit_id:
                branch_qs = branch_qs.filter(business_unit_id=business_unit_id)
            elif company_id:
                branch_qs = branch_qs.filter(company_id=company_id)
            if not branch_qs.exists():
                raise DomainException(f"Branch {branch_id} is invalid or does not belong to the selected hierarchy.", code="invalid_branch")
                
            if not is_super:
                from django.contrib.contenttypes.models import ContentType
                from apps.access_control.models import EntityAccessControl
                branch_ct = ContentType.objects.get_for_model(Branch)
                
                # Fallback to Profile check for legacy 1-to-1, or check Master ACL
                has_acl = EntityAccessControl.objects.filter(user=request.user, content_type=branch_ct, object_id=str(branch_id)).exists()
                if not has_acl and getattr(request.user, "profile", None):
                    has_acl = (request.user.profile.branch_id == str(branch_id))
                if not has_acl:
                    raise DomainException("You do not have authorization to access this Branch.", code="unauthorized_branch")

    @classmethod
    def set_context(
        cls, 
        request: HttpRequest, 
        company_id: Union[str, UUID], 
        business_unit_id: Optional[Union[str, UUID]] = None,
        branch_id: Optional[Union[str, UUID]] = None
    ):
        """Bind the tenant hierarchy to the current session."""
        cls._validate_hierarchy(request, company_id=company_id, business_unit_id=business_unit_id, branch_id=branch_id)
        request.session[cls.COMPANY_KEY] = str(company_id) if company_id else None
        request.session[cls.BUSINESS_UNIT_KEY] = str(business_unit_id) if business_unit_id else None
        request.session[cls.BRANCH_KEY] = str(branch_id) if branch_id else None

    @classmethod
    def set_company(cls, request: HttpRequest, company_id: Union[str, UUID]):
        if company_id:
            cls._validate_hierarchy(request, company_id=company_id)
        request.session[cls.COMPANY_KEY] = str(company_id) if company_id else None

    @classmethod
    def set_business_unit(cls, request: HttpRequest, business_unit_id: Union[str, UUID]):
        if business_unit_id:
            cls._validate_hierarchy(request, company_id=cls.get_company_id(request), business_unit_id=business_unit_id)
        request.session[cls.BUSINESS_UNIT_KEY] = str(business_unit_id) if business_unit_id else None

    @classmethod
    def set_branch(cls, request: HttpRequest, branch_id: Union[str, UUID]):
        if branch_id:
            cls._validate_hierarchy(
                request,
                company_id=cls.get_company_id(request), 
                business_unit_id=cls.get_business_unit_id(request), 
                branch_id=branch_id
            )
        request.session[cls.BRANCH_KEY] = str(branch_id) if branch_id else None

    @classmethod
    def set_company_bu(cls, request: HttpRequest, company_id: Union[str, UUID], business_unit_id: Union[str, UUID]):
        """Sets Company and BU together, resetting the active branch."""
        if company_id or business_unit_id:
            cls._validate_hierarchy(request, company_id=company_id, business_unit_id=business_unit_id)
        request.session[cls.COMPANY_KEY] = str(company_id) if company_id else None
        request.session[cls.BUSINESS_UNIT_KEY] = str(business_unit_id) if business_unit_id else None
        request.session[cls.BRANCH_KEY] = None

    @classmethod
    def set_bu_branch(cls, request: HttpRequest, business_unit_id: Union[str, UUID], branch_id: Union[str, UUID]):
        """Sets BU and Branch together."""
        if business_unit_id or branch_id:
            cls._validate_hierarchy(
                request,
                company_id=cls.get_company_id(request), 
                business_unit_id=business_unit_id, 
                branch_id=branch_id
            )
        request.session[cls.BUSINESS_UNIT_KEY] = str(business_unit_id) if business_unit_id else None
        request.session[cls.BRANCH_KEY] = str(branch_id) if branch_id else None

    @classmethod
    def get_company_id(cls, request: HttpRequest) -> Optional[str]:
        return request.session.get(cls.COMPANY_KEY)

    @classmethod
    def get_business_unit_id(cls, request: HttpRequest) -> Optional[str]:
        return request.session.get(cls.BUSINESS_UNIT_KEY)

    @classmethod
    def get_branch_id(cls, request: HttpRequest) -> Optional[str]:
        return request.session.get(cls.BRANCH_KEY)

    @classmethod
    def clear_context(cls, request: HttpRequest):
        """Wipe tenant context from session."""
        for key in [cls.COMPANY_KEY, cls.BUSINESS_UNIT_KEY, cls.BRANCH_KEY]:
            if key in request.session:
                del request.session[key]
