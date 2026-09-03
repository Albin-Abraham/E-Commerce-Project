import logging
from django.db.models import Count, Q
from apps.customers.models.shopping import CartItem, WishlistItem, ProductLike
from apps.procurement_pos.models.selling import SalesInvoiceItem
from apps.shop.infrastructure.models.product import Product

logger = logging.getLogger(__name__)


class CustomerRecommendationService:
    """
    Smart Product Recommendation & "Frequently Bought Together" Co-occurrence Engine.
    Powers customer storefront recommendations ("Suggested For You", "Customers Who Bought This Also Bought").
    """

    @classmethod
    def get_suggested_products_for_customer(cls, customer_id: str, limit: int = 6) -> list[dict]:
        """
        Recommends products tailored to customer preferences derived from Wishlist, Cart, and Liked products.
        Falls back to platform top-liked/popular items if customer history is minimal.
        """
        # 1. Collect category IDs from Customer's Cart, Wishlist, and Likes
        cart_cats = CartItem.objects.filter(cart__customer_id=customer_id, product__category__isnull=False).values_list("product__category_id", flat=True)
        wish_cats = WishlistItem.objects.filter(wishlist__customer_id=customer_id, product__category__isnull=False).values_list("product__category_id", flat=True)
        like_cats = ProductLike.objects.filter(customer_id=customer_id, product__category__isnull=False).values_list("product__category_id", flat=True)

        fav_category_ids = set(cart_cats) | set(wish_cats) | set(like_cats)

        # 2. Exclude products already in Cart
        cart_product_ids = set(CartItem.objects.filter(cart__customer_id=customer_id).values_list("product_id", flat=True))

        qs = Product.objects.filter(is_active=True, status="ACTIVE").exclude(id__in=cart_product_ids)

        if fav_category_ids:
            # Prioritize products matching customer's favorite categories
            recommended_qs = qs.filter(category_id__in=fav_category_ids).annotate(like_cnt=Count("likes")).order_by("-like_cnt", "-created_at")[:limit]
            results = list(recommended_qs)
            if len(results) < limit:
                needed = limit - len(results)
                existing_ids = set(p.id for p in results) | cart_product_ids
                fallback = qs.exclude(id__in=existing_ids).annotate(like_cnt=Count("likes")).order_by("-like_cnt", "-created_at")[:needed]
                results.extend(list(fallback))
        else:
            # Fallback to top-liked trending products
            results = list(qs.annotate(like_cnt=Count("likes")).order_by("-like_cnt", "-created_at")[:limit])

        return [
            {
                "product_id": str(p.id),
                "name": p.name,
                "sku": p.sku,
                "price": float(p.price),
                "category_id": str(p.category_id) if p.category_id else None,
                "seller_name": str(p.party) if p.party_id else "Platform Direct",
            }
            for p in results
        ]

    @classmethod
    def get_frequently_bought_together(cls, product_id: str, limit: int = 4) -> list[dict]:
        """
        Co-occurrence engine: Identifies products frequently purchased in the same Sales Invoice as product_id.
        """
        # Find invoice IDs containing the target product
        invoice_ids = SalesInvoiceItem.objects.filter(product_id=product_id).values_list("sales_invoice_id", flat=True).distinct()
        if not invoice_ids:
            return []

        # Find other products in those same invoices
        co_occurring_product_ids = (
            SalesInvoiceItem.objects.filter(sales_invoice_id__in=invoice_ids)
            .exclude(product_id=product_id)
            .values("product_id")
            .annotate(co_occurrence=Count("id"))
            .order_by("-co_occurrence")[:limit]
        )

        p_map = {item["product_id"]: item["co_occurrence"] for item in co_occurring_product_ids}
        products = Product.objects.filter(id__in=p_map.keys(), is_active=True, status="ACTIVE")

        results = []
        for p in products:
            results.append({
                "product_id": str(p.id),
                "name": p.name,
                "sku": p.sku,
                "price": float(p.price),
                "co_occurrence_count": p_map.get(str(p.id), 0),
                "seller_name": str(p.party) if p.party_id else "Platform Direct",
            })

        results.sort(key=lambda x: x["co_occurrence_count"], reverse=True)
        return results
