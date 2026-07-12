from django.urls import path
from apps.shop.interface.views.product_views import ProductViewSet
from apps.shop.interface.views.category_views import CategoryViewSet
from apps.shop.interface.views.order_views import OrderViewSet

urlpatterns = [
    path(
        "products/",
        ProductViewSet.as_view(),
        {"HTTP_METHOD": ["get", "post"]},
        name="shop-product-list",
    ),
    path(
        "products/<str:pk>/",
        ProductViewSet.as_view(),
        {"HTTP_METHOD": ["get", "put", "patch", "delete"]},
        name="shop-product-detail",
    ),
    path(
        "categories/",
        CategoryViewSet.as_view(),
        {"HTTP_METHOD": ["get", "post"]},
        name="shop-category-list",
    ),
    path(
        "categories/<str:pk>/",
        CategoryViewSet.as_view(),
        {"HTTP_METHOD": ["get", "put", "patch", "delete"]},
        name="shop-category-detail",
    ),
    path(
        "orders/",
        OrderViewSet.as_view(),
        {"HTTP_METHOD": ["get", "post"]},
        name="shop-order-list",
    ),
    path(
        "orders/<str:pk>/",
        OrderViewSet.as_view(),
        {"HTTP_METHOD": ["get", "put", "patch", "delete"]},
        name="shop-order-detail",
    ),
]
