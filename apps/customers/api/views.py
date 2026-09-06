from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.customers.models.customer import Customer, CustomerPreference, CustomerAddress, CustomerContact
from apps.customers.models.shopping import Cart, CartItem, Wishlist, WishlistItem, ProductLike
from apps.customers.api.serializers import (
    CustomerSerializer,
    CustomerPreferenceSerializer,
    CustomerAddressSerializer,
    CustomerContactSerializer,
    CartSerializer,
    CartItemSerializer,
    WishlistSerializer,
    WishlistItemSerializer,
    ProductLikeSerializer,
)
from apps.customers.services.cart_service import CustomerCartService
from apps.customers.services.wishlist_service import CustomerWishlistService
from apps.customers.services.recommendation_service import CustomerRecommendationService
from apps.customers.workflows.checkout_workflow import CustomerCheckoutService


from apps.customers.services.registration_service import CustomerRegistrationService
from apps.customers.services.oauth_service import SocialOAuthAuthService


class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    lookup_field = "pk"

    @action(detail=False, methods=["post"], url_path="register", permission_classes=[AllowAny])
    def register_customer(self, request):
        """
        Self-registration endpoint for Retail (INDIVIDUAL) and Business (COMMERCIAL) Customers.
        """
        username = request.data.get("username")
        email = request.data.get("email")
        password = request.data.get("password")
        full_name = request.data.get("full_name") or request.data.get("name")
        customer_type = request.data.get("customer_type", "INDIVIDUAL")
        phone = request.data.get("phone")
        tax_id = request.data.get("tax_id")
        company_id = request.data.get("company_id")
        address_data = request.data.get("address")

        if not username or not email or not password or not full_name:
            return Response(
                {"detail": "username, email, password, and full_name are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user, customer = CustomerRegistrationService.register_customer(
                username=username,
                email=email,
                password=password,
                full_name=full_name,
                customer_type=customer_type,
                phone=phone,
                tax_id=tax_id,
                company_id=company_id,
                address_data=address_data,
            )
            serializer = CustomerSerializer(customer)
            return Response(
                {
                    "message": f"Customer '{customer.name}' registered successfully!",
                    "user_id": str(user.id),
                    "username": user.username,
                    "customer": serializer.data,
                },
                status=status.HTTP_201_CREATED,
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=["post"], url_path="social-login", permission_classes=[AllowAny])
    def social_login(self, request):
        """
        Social Login & OAuth SSO Endpoint (Google, GitHub, Facebook, Apple, Microsoft).
        """
        provider = request.data.get("provider")
        provider_uid = request.data.get("provider_uid") or request.data.get("uid")
        email = request.data.get("email")
        full_name = request.data.get("full_name") or request.data.get("name", "Social User")
        avatar_url = request.data.get("avatar_url")
        extra_data = request.data.get("extra_data", {})

        if not provider or not provider_uid or not email:
            return Response(
                {"detail": "provider, provider_uid, and email are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user, customer, social_acc, created = SocialOAuthAuthService.authenticate_or_register_social_user(
                provider=provider,
                provider_uid=provider_uid,
                email=email,
                full_name=full_name,
                avatar_url=avatar_url,
                extra_data=extra_data,
            )
            customer_data = CustomerSerializer(customer).data if customer else None
            return Response(
                {
                    "message": "Social authentication successful!",
                    "is_new_user": created,
                    "provider": social_acc.provider,
                    "user_id": str(user.id),
                    "username": user.username,
                    "email": user.email,
                    "customer": customer_data,
                },
                status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)


class CustomerAddressViewSet(viewsets.ModelViewSet):
    queryset = CustomerAddress.objects.all()
    serializer_class = CustomerAddressSerializer
    filterset_fields = ["customer", "address_type", "pincode"]


class CustomerPreferenceViewSet(viewsets.ModelViewSet):
    queryset = CustomerPreference.objects.all()
    serializer_class = CustomerPreferenceSerializer


class CustomerContactViewSet(viewsets.ModelViewSet):
    queryset = CustomerContact.objects.all()
    serializer_class = CustomerContactSerializer
    filterset_fields = ["customer", "contact_type"]


class CartViewSet(viewsets.ModelViewSet):
    queryset = Cart.objects.all()
    serializer_class = CartSerializer
    filterset_fields = ["customer", "status"]

    @action(detail=False, methods=["post"], url_path="add-item")
    def add_item(self, request):
        customer_id = request.data.get("customer_id")
        product_id = request.data.get("product_id")
        variant_id = request.data.get("variant_id")
        quantity = int(request.data.get("quantity", 1))

        if not customer_id or not product_id:
            return Response({"detail": "customer_id and product_id are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            cart_item = CustomerCartService.add_item(
                customer_id=customer_id,
                product_id=product_id,
                variant_id=variant_id,
                quantity=quantity,
            )
            serializer = CartItemSerializer(cart_item)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=["get"], url_path="breakdown")
    def breakdown(self, request):
        customer_id = request.query_params.get("customer_id")
        pincode = request.query_params.get("pincode")
        if not customer_id:
            return Response({"detail": "customer_id query param is required."}, status=status.HTTP_400_BAD_REQUEST)

        breakdown_data = CustomerCartService.get_cart_breakdown(customer_id, target_pincode=pincode)
        return Response(breakdown_data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["post"], url_path="checkout")
    def checkout(self, request):
        cart_id = request.data.get("cart_id")
        delivery_address_id = request.data.get("delivery_address_id")
        payment_method = request.data.get("payment_method", "CARD")

        if not cart_id or not delivery_address_id:
            return Response({"detail": "cart_id and delivery_address_id are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            sales_order, sales_invoice = CustomerCheckoutService.process_checkout(
                cart_id=cart_id,
                delivery_address_id=delivery_address_id,
                payment_method=payment_method,
            )
            return Response(
                {
                    "message": "Checkout successfully processed!",
                    "sales_order_id": str(sales_order.id),
                    "sales_order_number": sales_order.order_number,
                    "sales_invoice_id": str(sales_invoice.id),
                    "sales_invoice_number": sales_invoice.invoice_number,
                    "grand_total": float(sales_invoice.grand_total),
                },
                status=status.HTTP_200_OK,
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)


class WishlistViewSet(viewsets.ModelViewSet):
    queryset = Wishlist.objects.all()
    serializer_class = WishlistSerializer
    filterset_fields = ["customer", "is_public"]

    @action(detail=False, methods=["post"], url_path="add-item")
    def add_item(self, request):
        customer_id = request.data.get("customer_id")
        product_id = request.data.get("product_id")
        variant_id = request.data.get("variant_id")

        if not customer_id or not product_id:
            return Response({"detail": "customer_id and product_id are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            wish_item = CustomerWishlistService.add_to_wishlist(
                customer_id=customer_id,
                product_id=product_id,
                variant_id=variant_id,
            )
            serializer = WishlistItemSerializer(wish_item)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=["get"], url_path="breakdown")
    def breakdown(self, request):
        customer_id = request.query_params.get("customer_id")
        if not customer_id:
            return Response({"detail": "customer_id query param is required."}, status=status.HTTP_400_BAD_REQUEST)

        breakdown_data = CustomerWishlistService.get_wishlist_breakdown(customer_id)
        return Response(breakdown_data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["post"], url_path="move-to-cart")
    def move_to_cart(self, request):
        customer_id = request.data.get("customer_id")
        wishlist_item_id = request.data.get("wishlist_item_id")
        quantity = int(request.data.get("quantity", 1))

        if not customer_id or not wishlist_item_id:
            return Response({"detail": "customer_id and wishlist_item_id are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            cart_item = CustomerWishlistService.move_wishlist_item_to_cart(
                customer_id=customer_id,
                wishlist_item_id=wishlist_item_id,
                quantity=quantity,
            )
            serializer = CartItemSerializer(cart_item)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)


class ProductLikeViewSet(viewsets.ModelViewSet):
    queryset = ProductLike.objects.all()
    serializer_class = ProductLikeSerializer
    filterset_fields = ["customer", "product"]

    @action(detail=False, methods=["post"], url_path="toggle")
    def toggle(self, request):
        customer_id = request.data.get("customer_id")
        product_id = request.data.get("product_id")

        if not customer_id or not product_id:
            return Response({"detail": "customer_id and product_id are required."}, status=status.HTTP_400_BAD_REQUEST)

        is_liked = CustomerWishlistService.toggle_product_like(customer_id, product_id)
        total_likes = CustomerWishlistService.get_product_like_count(product_id)
        return Response(
            {"product_id": product_id, "is_liked": is_liked, "total_likes": total_likes},
            status=status.HTTP_200_OK,
        )


class CustomerRecommendationViewSet(viewsets.ViewSet):
    @action(detail=False, methods=["get"], url_path="suggested")
    def suggested(self, request):
        customer_id = request.query_params.get("customer_id")
        limit = int(request.query_params.get("limit", 6))
        if not customer_id:
            return Response({"detail": "customer_id query param is required."}, status=status.HTTP_400_BAD_REQUEST)

        suggestions = CustomerRecommendationService.get_suggested_products_for_customer(customer_id, limit=limit)
        return Response(suggestions, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"], url_path="frequently-bought-together")
    def frequently_bought_together(self, request):
        product_id = request.query_params.get("product_id")
        limit = int(request.query_params.get("limit", 4))
        if not product_id:
            return Response({"detail": "product_id query param is required."}, status=status.HTTP_400_BAD_REQUEST)

        frequently_bought = CustomerRecommendationService.get_frequently_bought_together(product_id, limit=limit)
        return Response(frequently_bought, status=status.HTTP_200_OK)
