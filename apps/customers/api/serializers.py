from rest_framework import serializers
from apps.customers.models.customer import Customer, CustomerPreference, CustomerAddress, CustomerContact
from apps.customers.models.shopping import Cart, CartItem, Wishlist, WishlistItem, ProductLike
from apps.shop.infrastructure.models.product import Product


class CustomerPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerPreference
        fields = [
            "customer",
            "preferred_language",
            "preferred_currency",
            "newsletter_opt_in",
            "sms_notifications",
            "email_notifications",
            "whatsapp_notifications",
            "default_payment_method",
            "custom_settings",
            "created_at",
            "updated_at",
        ]


class CustomerAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerAddress
        fields = [
            "id",
            "customer",
            "title",
            "address_type",
            "attention_to",
            "address_line_1",
            "address_line_2",
            "city",
            "state",
            "postal_code",
            "country",
            "pincode",
            "is_default_delivery",
            "is_default_billing",
            "created_at",
            "updated_at",
        ]


class CustomerContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerContact
        fields = [
            "id",
            "customer",
            "contact_name",
            "designation",
            "contact_type",
            "email",
            "phone",
            "mobile",
            "is_primary",
            "created_at",
            "updated_at",
        ]


class CustomerSerializer(serializers.ModelSerializer):
    preferences = CustomerPreferenceSerializer(read_only=True)
    address_lines = CustomerAddressSerializer(many=True, read_only=True)
    contact_lines = CustomerContactSerializer(many=True, read_only=True)

    class Meta:
        model = Customer
        fields = [
            "id",
            "customer_code",
            "user",
            "name",
            "customer_type",
            "email",
            "phone",
            "tax_id",
            "credit_limit",
            "is_active",
            "preferences",
            "address_lines",
            "contact_lines",
            "metadata",
            "created_at",
            "updated_at",
        ]


class CartItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    variant_name = serializers.CharField(source="variant.name", read_only=True, default=None)

    class Meta:
        model = CartItem
        fields = [
            "id",
            "cart",
            "product",
            "product_name",
            "variant",
            "variant_name",
            "quantity",
            "unit_price",
            "total_price",
            "is_disabled",
            "disable_reason",
            "created_at",
            "updated_at",
        ]


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)

    class Meta:
        model = Cart
        fields = [
            "id",
            "customer",
            "status",
            "currency",
            "total_amount",
            "items",
            "created_at",
            "updated_at",
        ]


class WishlistItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    variant_name = serializers.CharField(source="variant.name", read_only=True, default=None)

    class Meta:
        model = WishlistItem
        fields = [
            "id",
            "wishlist",
            "product",
            "product_name",
            "variant",
            "variant_name",
            "notes",
            "created_at",
            "updated_at",
        ]


class WishlistSerializer(serializers.ModelSerializer):
    items = WishlistItemSerializer(many=True, read_only=True)

    class Meta:
        model = Wishlist
        fields = [
            "id",
            "customer",
            "name",
            "is_public",
            "items",
            "created_at",
            "updated_at",
        ]


class ProductLikeSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)

    class Meta:
        model = ProductLike
        fields = [
            "id",
            "customer",
            "product",
            "product_name",
            "created_at",
        ]


class SocialAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = SocialAccount
        fields = [
            "id",
            "user",
            "provider",
            "uid",
            "avatar_url",
            "extra_data",
            "last_login_at",
            "created_at",
        ]
