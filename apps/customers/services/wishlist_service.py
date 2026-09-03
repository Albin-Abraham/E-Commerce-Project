import logging
from django.db import transaction
from apps.customers.models.shopping import Wishlist, WishlistItem, ProductLike
from apps.customers.models.customer import Customer
from apps.customers.services.cart_service import CustomerCartService
from apps.shop.infrastructure.models.product import Product, ProductVariant
from apps.shop.infrastructure.models.facility import FacilityInventory

logger = logging.getLogger(__name__)


class CustomerWishlistService:
    """
    Customer Wishlist Operations, Product Likes & Wishlist Availability Engine.
    Provides split available/unavailable wishlist resolution and product like counters.
    """

    @classmethod
    @transaction.atomic
    def toggle_product_like(cls, customer_id: str, product_id: str) -> bool:
        """
        Toggles like/favorite state for a customer on a product.
        Returns True if liked, False if unliked.
        """
        customer = Customer.objects.get(pk=customer_id)
        product = Product.objects.get(pk=product_id)

        like_obj = ProductLike.objects.filter(customer=customer, product=product).first()
        if like_obj:
            like_obj.delete()
            return False
        else:
            ProductLike.objects.create(customer=customer, product=product)
            return True

    @classmethod
    def get_product_like_count(cls, product_id: str) -> int:
        """
        Returns total likes count for a product.
        """
        return ProductLike.objects.filter(product_id=product_id).count()

    @classmethod
    @transaction.atomic
    def get_wishlist_breakdown(cls, customer_id: str, name: str = "My Wishlist") -> dict:
        """
        Evaluates wishlist items in real-time and separates them into Available vs Unavailable sections.
        """
        wishlist = cls.get_or_create_wishlist(customer_id, name)
        items = wishlist.items.select_related("product", "variant").all()

        available_items = []
        unavailable_items = []

        for item in items:
            product = item.product
            reason = None

            if not product.is_active or product.status != "ACTIVE":
                reason = "PRODUCT_UNAVAILABLE"
            elif product.party_id:
                seller = product.party
                if seller and hasattr(seller, "is_active") and not seller.is_active:
                    reason = "SELLER_INACTIVE"

            if not reason:
                inv_qs = FacilityInventory.objects.filter(product=product)
                if item.variant:
                    inv_qs = inv_qs.filter(variant=item.variant)
                
                total_stock = sum(inv.quantity_available for inv in inv_qs)
                if total_stock == 0:
                    reason = "OUT_OF_STOCK"

            current_price = item.variant.price if (item.variant and item.variant.price) else product.price
            payload = {
                "wishlist_item_id": str(item.id),
                "product_id": str(product.id),
                "product_name": product.name,
                "variant_name": item.variant.name if item.variant else None,
                "current_price": current_price,
                "seller_name": str(product.party) if product.party_id else "Platform Direct",
                "likes_count": cls.get_product_like_count(str(product.id)),
            }

            if reason:
                payload["reason"] = reason
                unavailable_items.append(payload)
            else:
                available_items.append(payload)

        return {
            "wishlist_id": str(wishlist.id),
            "wishlist_name": wishlist.name,
            "available_items": available_items,
            "unavailable_items": unavailable_items,
            "available_count": len(available_items),
            "unavailable_count": len(unavailable_items),
        }

    @classmethod
    @transaction.atomic
    def get_or_create_wishlist(cls, customer_id: str, name: str = "My Wishlist") -> Wishlist:
        """
        Gets primary customer wishlist or creates a default wishlist.
        """
        customer = Customer.objects.get(pk=customer_id)
        wishlist = Wishlist.objects.filter(customer=customer, name=name).first()
        if not wishlist:
            wishlist = Wishlist.objects.create(customer=customer, name=name)
        return wishlist

    @classmethod
    @transaction.atomic
    def add_to_wishlist(cls, customer_id: str, product_id: str, variant_id: str | None = None, name: str = "My Wishlist") -> WishlistItem:
        """
        Adds a product to customer wishlist after seller validation.
        """
        product = Product.objects.get(pk=product_id)
        CustomerCartService.validate_seller_and_product(product)

        variant = ProductVariant.objects.get(pk=variant_id) if variant_id else None
        wishlist = cls.get_or_create_wishlist(customer_id, name)

        item, created = WishlistItem.objects.get_or_create(
            wishlist=wishlist,
            product=product,
            variant=variant,
        )
        return item

    @classmethod
    @transaction.atomic
    def remove_from_wishlist(cls, wishlist_item_id: str) -> None:
        """
        Removes an item from customer wishlist.
        """
        WishlistItem.objects.filter(pk=wishlist_item_id).delete()

    @classmethod
    @transaction.atomic
    def move_wishlist_item_to_cart(cls, customer_id: str, wishlist_item_id: str, quantity: int = 1):
        """
        Moves item from wishlist directly into active cart and deletes the wishlist item.
        """
        witem = WishlistItem.objects.select_related("product", "variant").get(pk=wishlist_item_id)
        
        # Add to cart via Cart Service (performs seller/vendor checks)
        cart_item = CustomerCartService.add_item(
            customer_id=customer_id,
            product_id=str(witem.product_id),
            variant_id=str(witem.variant_id) if witem.variant_id else None,
            quantity=quantity,
        )

        # Remove from wishlist after successful cart addition
        witem.delete()
        logger.info(f"Moved wishlist item #{wishlist_item_id} to cart for customer #{customer_id}")
        return cart_item
