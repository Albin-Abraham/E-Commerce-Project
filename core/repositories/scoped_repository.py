# core/repositories/scoped_repository.py
from typing import Any, Generic, TypeVar

from django.db.models import Model, QuerySet

from core.context.context_manager import RequestContextManager
from core.context.request_context import RequestContext
from core.repositories.base import BaseRepository
from core.tenancy.strategies.resolver import ScopingStrategyResolver

T = TypeVar("T", bound=Model)


class StrategyScopedRepository(BaseRepository[T], Generic[T]):
    """
    Industrialized Strategy-Scoped Repository.
    Enforces data access boundaries by delegating queryset scoping
    to the active IScopingStrategy based on caller RequestContext.
    """

    def get_context(self, context: RequestContext | None = None) -> RequestContext:
        return context or RequestContextManager.get()

    def get_queryset(self, context: RequestContext | None = None) -> QuerySet[T]:
        """Returns a QuerySet pre-filtered by the appropriate IScopingStrategy."""
        req_context = self.get_context(context)
        strategy = ScopingStrategyResolver.resolve_for(self.model, req_context)
        return strategy.apply(self.model.objects.all(), req_context)

    def get_by_id(self, entity_id: Any, context: RequestContext | None = None) -> T:
        """
        Retrieves an entity within the caller's scoped boundary.
        If the entity exists in the system but outside the caller's scope,
        raises TenantAccessViolationError.
        """
        scoped_qs = self.get_queryset(context)
        try:
            return scoped_qs.get(id=entity_id)
        except self.model.DoesNotExist:
            from core.security.tenant_isolation.exceptions import TenantAccessViolationError

            # Check if record exists across un-scoped table to detect access violation
            if self.model.objects.filter(id=entity_id).exists():
                raise TenantAccessViolationError(
                    f"Security Alert: Unauthorized access attempt to '{self.model.__name__}' id '{entity_id}'."
                )
            raise self.model.DoesNotExist(f"{self.model.__name__} matching query does not exist.")

    def filter(self, *args, context: RequestContext | None = None, **kwargs) -> QuerySet[T]:
        return self.get_queryset(context).filter(*args, **kwargs)

    def create(self, context: RequestContext | None = None, **kwargs) -> T:
        """
        Creates an entity, guaranteeing the caller's ownership/tenant attributes
        are strictly enforced based on persona.
        """
        req_context = self.get_context(context)
        model_fields = [f.name for f in self.model._meta.get_fields()]

        if req_context.is_customer:
            if "user_id" in model_fields and req_context.user_id:
                kwargs["user_id"] = req_context.user_id
            if "customer_id" in model_fields and req_context.customer_id:
                kwargs["customer_id"] = req_context.customer_id

        elif req_context.is_vendor:
            if "supplier_id" in model_fields and req_context.supplier_id:
                kwargs["supplier_id"] = req_context.supplier_id
            if "company_id" in model_fields and req_context.company_id:
                kwargs["company_id"] = req_context.company_id

        elif req_context.is_staff:
            if "company_id" in model_fields and req_context.company_id:
                kwargs["company_id"] = req_context.company_id
            if "branch_id" in model_fields and req_context.branch_id:
                kwargs["branch_id"] = req_context.branch_id

        return self.model.objects.create(**kwargs)
