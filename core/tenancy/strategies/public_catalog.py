# core/tenancy/strategies/public_catalog.py
from django.db.models import QuerySet

from core.context.request_context import RequestContext
from core.tenancy.strategies.base import IScopingStrategy


class PublicCatalogStrategy(IScopingStrategy):
    """
    Public Catalog Scoping Strategy.
    Permits public storefront browsing of active products, categories, and brands
    without demanding a B2B company or tenant membership.
    """

    def apply(self, queryset: QuerySet, context: RequestContext) -> QuerySet:
        model_fields = [f.name for f in queryset.model._meta.get_fields()]
        filters = {}

        if "is_active" in model_fields:
            filters["is_active"] = True

        return queryset.filter(**filters)
