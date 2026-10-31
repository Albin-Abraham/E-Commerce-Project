# core/tenancy/strategies/customer_ownership.py
from django.db.models import QuerySet

from core.context.request_context import RequestContext
from core.tenancy.strategies.base import IScopingStrategy


class CustomerOwnershipStrategy(IScopingStrategy):
    """
    Customer Ownership Scoping Strategy.
    Enforces that customers (shoppers) only see their own personal data
    (carts, wishlists, personal orders, addresses) by filtering on user_id or customer_id.
    Bypasses B2B tenant/company selection completely.
    """

    def __init__(self, user_field: str = "user_id", customer_field: str = "customer_id"):
        self.user_field = user_field
        self.customer_field = customer_field

    def apply(self, queryset: QuerySet, context: RequestContext) -> QuerySet:
        if not context.user_id:
            return queryset.none()

        model_fields = {f.name for f in queryset.model._meta.get_fields()} | {
            getattr(f, "attname", "") for f in queryset.model._meta.get_fields()
        }

        # Filter by customer_id if available on both context and model
        if context.customer_id and (
            self.customer_field in model_fields or "customer" in model_fields
        ):
            field_key = "customer_id" if "customer_id" in model_fields else "customer"
            return queryset.filter(**{field_key: context.customer_id})

        # Otherwise filter by user_id
        if self.user_field in model_fields or "user" in model_fields:
            field_key = "user_id" if "user_id" in model_fields else "user"
            return queryset.filter(**{field_key: context.user_id})

        # Fallback to none if ownership cannot be safely verified
        return queryset.none()
