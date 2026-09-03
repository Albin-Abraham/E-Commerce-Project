import logging
from django.db import transaction
from apps.customers.models.shopping import Cart, CartItem
from apps.customers.models.customer import Customer
from apps.shop.infrastructure.models.product import Product, ProductVariant
from apps.shop.infrastructure.models.facility import FacilityInventory

logger = logging.getLogger(__name__)


class CustomerCartService:
    """
    Customer Cart Operations & Seller Product Validation Service.
    Validates product status and vendor/seller eligibility before cart operations.
    """

    @classmethod
    def validate_seller_and_product(cls, product: Product) -> None:
        """
        Validates that the product is active and its vendor/seller is in good standing.
        """
        if not product.is_active or product.status != "ACTIVE":
            raise ValueError(f"Product '{product.name}' is currently unavailable or inactive.")

        # Check vendor/seller standing if linked via PartyReferenceMixin
        if product.party_id:
            seller = product.party
            if seller and hasattr(seller, "is_active") and not seller.is_active:
                raise ValueError(f"Seller '{getattr(seller, 'name', product.party_id)}' is currently suspended. Items cannot be added to cart.")

    @classmethod
    @transaction.atomic
    def get_or_create_cart(cls, customer_id: str) -> Cart:
        """
        Gets active cart for customer or creates a new active cart.
        """
        customer = Customer.objects.get(pk=customer_id)
        cart = Cart.objects.filter(customer=customer, status="ACTIVE").first()
        if not cart:
            cart = Cart.objects.create(customer=customer, status="ACTIVE")
        return cart

    @classmethod
    @transaction.atomic
    def add_item(cls, customer_id: str, product_id: str, variant_id: str | None = None, quantity: int = 1) -> CartItem:
        """
        Adds a product to customer cart after seller and product validation.
        """
        if quantity <= 0:
            raise ValueError("Quantity must be greater than zero.")

        product = Product.objects.get(pk=product_id)
        cls.validate_seller_and_product(product)

        variant = ProductVariant.objects.get(pk=variant_id) if variant_id else None
        unit_price = variant.price if (variant and variant.price) else product.price

        cart = cls.get_or_create_cart(customer_id)
        cart_item = CartItem.objects.filter(cart=cart, product=product, variant=variant).first()

        if cart_item:
            cart_item.quantity += quantity
            cart_item.unit_price = unit_price
            cart_item.save()
        else:
            cart_item = CartItem.objects.create(
                cart=cart,
                product=product,
                variant=variant,
                quantity=quantity,
                unit_price=unit_price,
            )

        return cart_item

    @classmethod
    @transaction.atomic
    def update_item_quantity(cls, cart_item_id: str, quantity: int) -> CartItem:
        """
        Updates cart item quantity or removes if quantity is 0.
        """
        cart_item = CartItem.objects.get(pk=cart_item_id)
        if quantity <= 0:
            cart_item.delete()
            return cart_item

        cls.validate_seller_and_product(cart_item.product)
        cart_item.quantity = quantity
        cart_item.save()
        return cart_item

    @classmethod
    @transaction.atomic
    def remove_item(cls, cart_item_id: str) -> None:
        """
        Removes item from customer cart.
        """
        cart_item = CartItem.objects.get(pk=cart_item_id)
        cart = cart_item.cart
        cart_item.delete()
        cart.recalculate_total()

    @classmethod
    @transaction.atomic
    def get_cart_breakdown(cls, customer_id: str, target_pincode: str | None = None) -> dict:
        """
        Evaluates customer cart in real-time and separates items into Active vs Disabled/Unavailable sections.
        Identifies out-of-stock items, inactive sellers, and insufficient inventory.
        """
        cart = cls.get_or_create_cart(customer_id)
        items = cart.items.select_related("product", "variant").all()

        active_list = []
        disabled_list = []

        for item in items:
            product = item.product
            disable_reason = None

            # 1. Evaluate Product & Seller Standing
            if not product.is_active or product.status != "ACTIVE":
                disable_reason = "PRODUCT_UNAVAILABLE"
            elif product.party_id:
                seller = product.party
                if seller and hasattr(seller, "is_active") and not seller.is_active:
                    disable_reason = "SELLER_INACTIVE"

            # 2. Evaluate Real-Time Stock Availability (ATP)
            if not disable_reason:
                inv_qs = FacilityInventory.objects.filter(product=product)
                if item.variant:
                    inv_qs = inv_qs.filter(variant=item.variant)

                total_available = sum(inv.quantity_available for inv in inv_qs)

                if total_available == 0:
                    disable_reason = "OUT_OF_STOCK"
                elif total_available < item.quantity:
                    disable_reason = "INSUFFICIENT_STOCK"

            # 3. Update CartItem state
            if disable_reason:
                if not item.is_disabled or item.disable_reason != disable_reason:
                    item.is_disabled = True
                    item.disable_reason = disable_reason
                    item.save(update_fields=["is_disabled", "disable_reason", "updated_at"])
                disabled_list.append({
                    "cart_item_id": str(item.id),
                    "product_id": str(product.id),
                    "product_name": product.name,
                    "variant_name": item.variant.name if item.variant else None,
                    "quantity": item.quantity,
                    "unit_price": item.unit_price,
                    "disable_reason": disable_reason,
                    "seller_name": str(product.party) if product.party_id else "Platform Direct",
                })
            else:
                if item.is_disabled:
                    item.is_disabled = False
                    item.disable_reason = None
                    item.save(update_fields=["is_disabled", "disable_reason", "updated_at"])
                active_list.append({
                    "cart_item_id": str(item.id),
                    "product_id": str(product.id),
                    "product_name": product.name,
                    "variant_name": item.variant.name if item.variant else None,
                    "quantity": item.quantity,
                    "unit_price": item.unit_price,
                    "total_price": item.total_price,
                    "seller_name": str(product.party) if product.party_id else "Platform Direct",
                })

        subtotal = cart.recalculate_total()
        return {
            "cart_id": str(cart.id),
            "currency": cart.currency,
            "subtotal": subtotal,
            "active_items": active_list,
            "disabled_items": disabled_list,
            "active_count": len(active_list),
            "disabled_count": len(disabled_list),
        }
