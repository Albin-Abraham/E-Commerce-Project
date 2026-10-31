from collections.abc import Sequence
from datetime import datetime
from decimal import Decimal

from django.db import models


class OrderQuerySet(models.QuerySet):
    """
    Industrialized Domain QuerySet Primitives for Orders.
    Strictly composable: Every method returns self (un-evaluated QuerySet / qs statement).
    """

    def for_user(self, user_id: str) -> "OrderQuerySet":
        return self.filter(user_id=user_id)

    def with_items(self) -> "OrderQuerySet":
        """Pre-fetch related items and products to prevent N+1 queries."""
        return self.prefetch_related("items__product")

    def status_in(self, statuses: Sequence[str]) -> "OrderQuerySet":
        return self.filter(status__in=statuses)

    def total_between(
        self, min_total: Decimal | None = None, max_total: Decimal | None = None
    ) -> "OrderQuerySet":
        qs = self
        if min_total is not None:
            qs = qs.filter(total_amount__gte=min_total)
        if max_total is not None:
            qs = qs.filter(total_amount__lte=max_total)
        return qs

    def created_between(
        self, start_date: datetime | None = None, end_date: datetime | None = None
    ) -> "OrderQuerySet":
        qs = self
        if start_date is not None and end_date is not None:
            qs = qs.filter(created_at__range=(start_date, end_date))
        elif start_date is not None:
            qs = qs.filter(created_at__gte=start_date)
        elif end_date is not None:
            qs = qs.filter(created_at__lte=end_date)
        return qs
