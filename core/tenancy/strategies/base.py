# core/tenancy/strategies/base.py
from abc import ABC, abstractmethod

from django.db.models import QuerySet

from core.context.request_context import RequestContext


class IScopingStrategy(ABC):
    """
    Abstract Scoping Strategy Contract.
    Applies data isolation boundaries onto a Django QuerySet using caller RequestContext.
    """

    @abstractmethod
    def apply(self, queryset: QuerySet, context: RequestContext) -> QuerySet:
        pass
