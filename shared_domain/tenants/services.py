from typing import Any
from uuid import UUID

from shared_domain.validation.exceptions import DomainValidationError

from .interfaces import ITenantAuthorizationService, ITenantRepository


class TenantHierarchyService:
    """
    Pure Python Domain Service.
    Validates tenant existence, hierarchical linkage, and user authorization.
    """

    def __init__(self, repository: ITenantRepository, auth_service: ITenantAuthorizationService):
        self.repo = repository
        self.auth_service = auth_service

    def validate_hierarchy(
        self,
        user: Any,
        company_id: str | UUID | None = None,
        business_unit_id: str | UUID | None = None,
        branch_id: str | UUID | None = None,
    ) -> None:

        is_super = self.auth_service.is_superuser(user)

        # 1. Validate Company
        if company_id:
            if company_id == "__all__":
                raise DomainValidationError(
                    "Company cannot be '__all__'.", errors={"code": "invalid_company"}
                )

            if not self.repo.company_exists(company_id):
                raise DomainValidationError(
                    f"Company {company_id} does not exist.", errors={"code": "invalid_company"}
                )

            if not is_super and not self.auth_service.user_has_access(user, "company", company_id):
                raise DomainValidationError(
                    "You do not have authorization to access this Company.",
                    errors={"code": "unauthorized_company"},
                )

        # 2. Validate Business Unit
        if business_unit_id:
            if business_unit_id == "__all__":
                if not company_id:
                    raise DomainValidationError(
                        "Company must be specified to select all Business Units.",
                        errors={"code": "missing_company"},
                    )
            else:
                if not self.repo.business_unit_exists_in_company(business_unit_id, company_id):
                    raise DomainValidationError(
                        f"Business Unit {business_unit_id} is invalid or does not belong to the selected Company.",
                        errors={"code": "invalid_business_unit"},
                    )

        # 3. Validate Branch
        if branch_id:
            if branch_id == "__all__":
                if not is_super:
                    raise DomainValidationError(
                        "Only superadmin can select all branches.",
                        errors={"code": "unauthorized_branch_all"},
                    )
            else:
                if not self.repo.branch_exists_in_hierarchy(branch_id, business_unit_id, company_id):
                    raise DomainValidationError(
                        f"Branch {branch_id} is invalid or does not belong to the selected hierarchy.",
                        errors={"code": "invalid_branch"},
                    )

                if not is_super and not self.auth_service.user_has_access(user, "branch", branch_id):
                    raise DomainValidationError(
                        "You do not have authorization to access this Branch.",
                        errors={"code": "unauthorized_branch"},
                    )
