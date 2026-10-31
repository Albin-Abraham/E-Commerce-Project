# core/security/tenant_isolation/repository.py
from typing import Any, Generic, TypeVar

from django.db.models import Model, QuerySet

from core.admin.utils.context import RequestContext
from core.security.tenant_isolation.exceptions import (
    TenantAccessViolationError,
    TenantContextMissingError,
)

T = TypeVar("T", bound=Model)


class TenantScopedRepository(Generic[T]):
    """
    Industrialized Layer 3 Tenant Isolation Repository.
    Guarantees that all queries and mutations are strictly isolated to the
    currently authenticated tenant (Company).
    """

    def __init__(self, model_class: type[T]):
        self.model = model_class

    def get_current_company_id(self) -> str:
        """Resolves the current tenant identifier from RequestContext."""
        company_id = RequestContext.get_company_id()
        if not company_id:
            raise TenantContextMissingError(
                f"Cannot query tenant-scoped entity '{self.model.__name__}' without an established tenant context."
            )
        return str(company_id)

    def get_queryset(self) -> QuerySet[T]:
        """Returns a QuerySet pre-filtered by the current tenant."""
        company_id = self.get_current_company_id()
        return self.model.objects.filter(company_id=company_id)

    def get_by_id(self, entity_id: Any) -> T:
        """
        Retrieves an entity by ID within the current tenant scope.
        If the entity exists under a different tenant, raises TenantAccessViolationError.
        """
        company_id = self.get_current_company_id()
        try:
            return self.model.objects.get(id=entity_id, company_id=company_id)
        except self.model.DoesNotExist:
            # Check if entity exists in another tenant to distinguish 404 from security tampering
            if self.model.objects.filter(id=entity_id).exists():
                raise TenantAccessViolationError(
                    f"Security Alert: Attempted cross-tenant access to '{self.model.__name__}' id '{entity_id}'."
                )
            raise self.model.DoesNotExist(f"{self.model.__name__} matching query does not exist.")

    def filter(self, *args, **kwargs) -> QuerySet[T]:
        """Applies filters on top of the tenant-scoped QuerySet."""
        return self.get_queryset().filter(*args, **kwargs)

    def create(self, **kwargs) -> T:
        """
        Creates an entity, guaranteeing the tenant company_id is enforced
        and cannot be spoofed by callers.
        """
        company_id = self.get_current_company_id()
        # Enforce tenant ownership; overwrite any caller-provided mismatch
        kwargs["company_id"] = company_id
        return self.model.objects.create(**kwargs)

    def count(self) -> int:
        return self.get_queryset().count()

    def exists(self, **kwargs) -> bool:
        return self.get_queryset().filter(**kwargs).exists()
