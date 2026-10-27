from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.customers.api.views import (
    CartViewSet,
    CustomerAddressViewSet,
    CustomerContactViewSet,
    CustomerPreferenceViewSet,
    CustomerRecommendationViewSet,
    CustomerViewSet,
    ProductLikeViewSet,
    WishlistViewSet,
)

router = DefaultRouter()
router.register(r"customers", CustomerViewSet, basename="customer")
router.register(r"customer-addresses", CustomerAddressViewSet, basename="customer-address")
router.register(r"customer-preferences", CustomerPreferenceViewSet, basename="customer-preference")
router.register(r"customer-contacts", CustomerContactViewSet, basename="customer-contact")
router.register(r"carts", CartViewSet, basename="cart")
router.register(r"wishlists", WishlistViewSet, basename="wishlist")
router.register(r"product-likes", ProductLikeViewSet, basename="product-like")
router.register(r"recommendations", CustomerRecommendationViewSet, basename="recommendation")

urlpatterns = [
    path("", include(router.urls)),
]
