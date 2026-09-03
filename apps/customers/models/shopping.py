from django.db import models
from core.base_models.validator_model import BaseModel
from core.base_models.fields.short_ui_fields import CustomShortUUIDField
from apps.customers.models.customer import Customer
from apps.customers.valuesets import CART_STATUS_VALUESET


class Wishlist(BaseModel):
    """
    Customer Wishlist for saved products and items.
    """

    id = CustomShortUUIDField(primary_key=True, prefix="wish_")
    customer = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE,
        related_name="wishlists",
    )
    name = models.CharField(max_length=100, default="My Wishlist")
    is_public = models.BooleanField(default=False)

    class Meta(BaseModel.Meta):
        db_table = "customer_wishlists"
        verbose_name = "Wishlist"
        verbose_name_plural = "Wishlists"

    def __str__(self):
        return f"Wishlist '{self.name}' for {self.customer.name}"


class WishlistItem(BaseModel):
    """
    Wishlist Item linking customer wishlist to Catalog Product / Variant.
    """

    id = CustomShortUUIDField(primary_key=True, prefix="witem_")
    wishlist = models.ForeignKey(
        Wishlist,
        on_delete=models.CASCADE,
        related_name="items",
    )
    product = models.ForeignKey(
        "shop.Product",
        on_delete=models.CASCADE,
        related_name="wishlist_items",
    )
    variant = models.ForeignKey(
        "shop.ProductVariant",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="wishlist_items",
    )
    notes = models.CharField(max_length=255, blank=True, null=True)

    class Meta(BaseModel.Meta):
        db_table = "customer_wishlist_items"
        unique_together = [("wishlist", "product", "variant")]
        verbose_name = "Wishlist Item"
        verbose_name_plural = "Wishlist Items"

    def __str__(self):
        return f"Wishlist Item: {self.product.name}"


class ProductLike(BaseModel):
    """
    Customer Product Like & Favorite Interaction Entity.
    Tracks customer product likes for social proof, recommendation scoring, and trend analytics.
    """

    id = CustomShortUUIDField(primary_key=True, prefix="like_")
    customer = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE,
        related_name="product_likes",
    )
    product = models.ForeignKey(
        "shop.Product",
        on_delete=models.CASCADE,
        related_name="likes",
    )

    class Meta(BaseModel.Meta):
        db_table = "customer_product_likes"
        unique_together = [("customer", "product")]
        verbose_name = "Product Like"
        verbose_name_plural = "Product Likes"

    def __str__(self):
        return f"Like: {self.customer.name} -> {self.product.name}"


class Cart(BaseModel):
    """
    Customer Shopping Cart supporting active sessions, checkout reservation, and conversion to Sales Orders.
    """

    id = CustomShortUUIDField(primary_key=True, prefix="cart_")
    customer = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE,
        related_name="carts",
    )
    status = models.CharField(
        max_length=20,
        choices=CART_STATUS_VALUESET.as_django_choices(),
        default="ACTIVE",
    )
    currency = models.CharField(max_length=5, default="USD")
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)

    class Meta(BaseModel.Meta):
        db_table = "customer_carts"
        ordering = ["-updated_at"]
        verbose_name = "Cart"
        verbose_name_plural = "Carts"

    def recalculate_total(self):
        active_items = self.items.filter(is_disabled=False)
        total = sum(item.total_price for item in active_items)
        self.total_amount = total
        self.save(update_fields=["total_amount", "updated_at"])
        return total

    def __str__(self):
        return f"Cart #{self.id} ({self.status}) - ${self.total_amount}"


class CartItem(BaseModel):
    """
    Individual items inside a Customer Cart.
    Supports modern Amazon/Taobao split sections (Active vs Disabled/Unavailable items).
    """

    id = CustomShortUUIDField(primary_key=True, prefix="citem_")
    cart = models.ForeignKey(
        Cart,
        on_delete=models.CASCADE,
        related_name="items",
    )
    product = models.ForeignKey(
        "shop.Product",
        on_delete=models.CASCADE,
        related_name="cart_items",
    )
    variant = models.ForeignKey(
        "shop.ProductVariant",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="cart_items",
    )
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    total_price = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    is_disabled = models.BooleanField(
        default=False,
        help_text="If true, item is moved to disabled cart section (out of stock, seller inactive, price changed)",
    )
    disable_reason = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="Reason code e.g. OUT_OF_STOCK, SELLER_INACTIVE, PRODUCT_UNAVAILABLE, INSUFFICIENT_STOCK",
    )

    class Meta(BaseModel.Meta):
        db_table = "customer_cart_items"
        verbose_name = "Cart Item"
        verbose_name_plural = "Cart Items"

    def save(self, *args, **kwargs):
        self.total_price = self.unit_price * self.quantity
        super().save(*args, **kwargs)
        if self.cart_id:
            self.cart.recalculate_total()

    def __str__(self):
        return f"{self.quantity}x {self.product.name} (${self.total_price})"
