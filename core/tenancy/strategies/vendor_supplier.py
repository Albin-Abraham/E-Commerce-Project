# core/tenancy/strategies/vendor_supplier.py
from django.db.models import QuerySet

from core.context.request_context import RequestContext
from core.tenancy.strategies.base import IScopingStrategy


class VendorSupplierStrategy(IScopingStrategy):
    """
    Vendor / Merchant Scoping Strategy.
    Enforces that vendors can only access data belonging to their assigned Supplier
    or Vendor Company entity (products, inventory, received POs).
    """

    def __init__(self, supplier_field: str = "supplier_id", company_field: str = "company_id"):
        self.supplier_field = supplier_field
        self.company_field = company_field

    def apply(self, queryset: QuerySet, context: RequestContext) -> QuerySet:
        model_fields = {f.name for f in queryset.model._meta.get_fields()} | {
            getattr(f, "attname", "") for f in queryset.model._meta.get_fields()
        }
        filters = {}

        if context.supplier_id and (
            self.supplier_field in model_fields or "supplier" in model_fields
        ):
            filters["supplier_id" if "supplier_id" in model_fields else "supplier"] = (
                context.supplier_id
            )
        elif context.company_id and (
            self.company_field in model_fields or "company" in model_fields
        ):
            filters["company_id" if "company_id" in model_fields else "company"] = (
                context.company_id
            )
        else:
            # Vendor must have an active supplier or company context
            return queryset.none()

        return queryset.filter(**filters)
