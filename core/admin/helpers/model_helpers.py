from typing import Any
from django.db.models import Model, Q
from core.admin.utils.context import RequestContext

def get_object_with_scoping(
    model: Model,
    pk: Any,
    user: Any,
    include_deleted: bool = False,
    supports_soft_delete: bool = True,
) -> Model | None:
    """
    Retrieve an object with industrialized multi-tenant scoping (Company/Branch).
    Uses RequestContext as the source of truth.
    """
    queryset = model.objects.all()

    # 1. Multi-Tenant Scoping (Bypass for Superusers)
    if not user.is_superuser:
        company_id = RequestContext.get_company_id()
        branch_id = RequestContext.get_branch_id()

        q = Q()
        if hasattr(model, "company"):
            if company_id:
                # Own company + global objects
                q &= (Q(company=company_id) | Q(company__isnull=True))
            else:
                # If no company in context, only allow global objects
                q &= Q(company__isnull=True)
        
        if hasattr(model, "branch") and branch_id:
            q &= Q(branch=branch_id)
        
        if q:
            queryset = queryset.filter(q)

    # 2. Soft Delete
    if (
        hasattr(model, "is_deleted")
        and not include_deleted
        and supports_soft_delete
    ):
        queryset = queryset.filter(is_deleted=False)

    return queryset.filter(pk=pk).first()
