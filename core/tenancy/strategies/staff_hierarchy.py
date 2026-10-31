# core/tenancy/strategies/staff_hierarchy.py
from django.db.models import QuerySet

from core.context.request_context import RequestContext
from core.tenancy.strategies.base import IScopingStrategy


class StaffHierarchyStrategy(IScopingStrategy):
    """
    Staff / Enterprise Scoping Strategy.
    Enforces corporate hierarchical scoping across Company, Business Unit, and Branch.
    """

    def apply(self, queryset: QuerySet, context: RequestContext) -> QuerySet:
        if not context.company_id:
            return queryset.none()

        model_fields = {f.name for f in queryset.model._meta.get_fields()} | {
            getattr(f, "attname", "") for f in queryset.model._meta.get_fields()
        }
        filters = {}

        if "company_id" in model_fields or "company" in model_fields:
            filters["company_id" if "company_id" in model_fields else "company"] = (
                context.company_id
            )

        # Narrow to branch if context mandates branch isolation
        if context.branch_id and ("branch_id" in model_fields or "branch" in model_fields):
            filters["branch_id" if "branch_id" in model_fields else "branch"] = context.branch_id

        if context.business_unit_id and (
            "business_unit_id" in model_fields or "business_unit" in model_fields
        ):
            filters[
                "business_unit_id" if "business_unit_id" in model_fields else "business_unit"
            ] = context.business_unit_id

        return queryset.filter(**filters)
