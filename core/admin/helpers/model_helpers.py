from typing import Any
from django.db.models import Model, Q
from core.admin.utils.context import RequestContext


def build_tenant_filter(model: Model, user: Any) -> Q | None:
    """
    Build a multi-tenant Q filter for the given model and user.
    Returns None if the user is a superuser (bypass) or no scoping applies.
    """
    if user and user.is_superuser:
        return None

    company_id = RequestContext.get_company_id()
    business_unit_id = RequestContext.get_business_unit_id()
    branch_id = RequestContext.get_branch_id()

    q = Q()
    if hasattr(model, "company"):
        if company_id:
            q &= Q(company=company_id) | Q(company__isnull=True)
        else:
            q &= Q(company__isnull=True)

    if hasattr(model, "business_unit") and business_unit_id:
        q &= Q(business_unit=business_unit_id)

    if hasattr(model, "branch") and branch_id:
        q &= Q(branch=branch_id)

    return q if q else None


def get_object_with_scoping(
    model: Model,
    pk: Any,
    user: Any,
    include_deleted: bool = False,
    supports_soft_delete: bool = True,
) -> Model | None:
    """
    Retrieve a single object with multi-tenant scoping and soft-delete filtering.
    """
    queryset = model.objects.all()

    tenant_q = build_tenant_filter(model, user)
    if tenant_q:
        queryset = queryset.filter(tenant_q)

    if (
        hasattr(model, "is_deleted")
        and not include_deleted
        and supports_soft_delete
    ):
        queryset = queryset.filter(is_deleted=False)

    return queryset.filter(pk=pk).first()
