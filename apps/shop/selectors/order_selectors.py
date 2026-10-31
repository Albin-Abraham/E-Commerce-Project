from collections.abc import Sequence
from datetime import datetime
from decimal import Decimal

from django.db.models import QuerySet

from apps.shop.infrastructure.models.order import Order


def get_user_orders_qs(
    *,
    user_id: str | None = None,
    statuses: Sequence[str] | None = None,
    min_total: Decimal | None = None,
    max_total: Decimal | None = None,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    base_qs: QuerySet[Order] | None = None,
) -> QuerySet[Order]:
    """
    Returns an un-evaluated QuerySet (qs statement) for retrieving orders with items pre-fetched.
    Defers execution to paginator/caller.
    """
    qs = base_qs if base_qs is not None else Order.objects.all()
    qs = qs.with_items()

    if user_id:
        qs = qs.for_user(user_id)
    if statuses:
        qs = qs.status_in(statuses)
    if min_total is not None or max_total is not None:
        qs = qs.total_between(min_total, max_total)
    if start_date is not None or end_date is not None:
        qs = qs.created_between(start_date, end_date)

    return qs
