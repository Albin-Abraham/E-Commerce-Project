from decimal import Decimal

from django.db.models import QuerySet

from apps.shop.infrastructure.models.product import Product


def get_storefront_catalog_qs(
    *,
    base_qs: QuerySet[Product] | None = None,
    category_id: str | None = None,
    brand_id: str | None = None,
    min_price: Decimal | None = None,
    max_price: Decimal | None = None,
    in_stock_only: bool = False,
) -> QuerySet[Product]:
    """
    Returns an un-evaluated QuerySet (qs statement) optimized for storefront display.
    Never evaluates (.all(), .first(), list()). Defers execution to paginator/caller.
    """
    qs = base_qs if base_qs is not None else Product.objects.all()
    qs = qs.active().with_relations()

    if category_id:
        qs = qs.by_category(category_id)
    if brand_id:
        qs = qs.by_brand(brand_id)
    if min_price is not None or max_price is not None:
        qs = qs.price_between(min_price, max_price)
    if in_stock_only:
        qs = qs.in_stock()

    return qs


def get_product_detail_qs(
    product_id: str,
    *,
    base_qs: QuerySet[Product] | None = None,
) -> QuerySet[Product]:
    """
    Returns an un-evaluated QuerySet (qs statement) for retrieving a single product
    with all related variant and inventory data pre-fetched.
    """
    qs = base_qs if base_qs is not None else Product.objects.all()
    return qs.with_relations().filter(id=product_id)
