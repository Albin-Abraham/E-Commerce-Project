from django.urls import path
from apps.shop.interface.views import (
    BrandViewSet,
    CategoryViewSet,
    ProductViewSet,
    ProductVariantViewSet,
    WarehouseViewSet,
    InventoryViewSet,
    OrderViewSet,
    OrderItemViewSet,
    EntityEdgeViewSet,
    CategoryEdgeViewSet,
    BOMEdgeViewSet,
)

urlpatterns = [
    # Brands
    path("brands/", BrandViewSet.as_view(), {"HTTP_METHOD": ["GET", "POST"]}, name="shop-brand-list"),
    path("brands/<str:pk>/", BrandViewSet.as_view(), {"HTTP_METHOD": ["GET", "PUT", "DELETE"]}, name="shop-brand-detail"),

    # Categories
    path("categories/", CategoryViewSet.as_view(), {"HTTP_METHOD": ["GET", "POST"]}, name="shop-category-list"),
    path("categories/<str:pk>/", CategoryViewSet.as_view(), {"HTTP_METHOD": ["GET", "PUT", "DELETE"]}, name="shop-category-detail"),

    # Products
    path("products/", ProductViewSet.as_view(), {"HTTP_METHOD": ["GET", "POST"]}, name="shop-product-list"),
    path("products/<str:pk>/", ProductViewSet.as_view(), {"HTTP_METHOD": ["GET", "PUT", "DELETE"]}, name="shop-product-detail"),

    # Product Variants
    path("variants/", ProductVariantViewSet.as_view(), {"HTTP_METHOD": ["GET", "POST"]}, name="shop-variant-list"),
    path("variants/<str:pk>/", ProductVariantViewSet.as_view(), {"HTTP_METHOD": ["GET", "PUT", "DELETE"]}, name="shop-variant-detail"),

    # Warehouses & Inventory
    path("warehouses/", WarehouseViewSet.as_view(), {"HTTP_METHOD": ["GET", "POST"]}, name="shop-warehouse-list"),
    path("warehouses/<str:pk>/", WarehouseViewSet.as_view(), {"HTTP_METHOD": ["GET", "PUT", "DELETE"]}, name="shop-warehouse-detail"),
    path("inventory/", InventoryViewSet.as_view(), {"HTTP_METHOD": ["GET", "POST"]}, name="shop-inventory-list"),
    path("inventory/<str:pk>/", InventoryViewSet.as_view(), {"HTTP_METHOD": ["GET", "POST", "PUT", "DELETE"]}, name="shop-inventory-detail"),

    # Orders
    path("orders/", OrderViewSet.as_view(), {"HTTP_METHOD": ["GET", "POST"]}, name="shop-order-list"),
    path("orders/<str:pk>/", OrderViewSet.as_view(), {"HTTP_METHOD": ["GET", "PUT", "DELETE"]}, name="shop-order-detail"),
    path("order-items/", OrderItemViewSet.as_view(), {"HTTP_METHOD": ["GET", "POST"]}, name="shop-orderitem-list"),

    # Knowledge Graph, Category Graph & BOM DAG
    path("graph/entity-edges/", EntityEdgeViewSet.as_view(), {"HTTP_METHOD": ["GET", "POST"]}, name="shop-entity-edge-list"),
    path("graph/entity-edges/<str:pk>/", EntityEdgeViewSet.as_view(), {"HTTP_METHOD": ["GET", "PUT", "DELETE"]}, name="shop-entity-edge-detail"),
    path("graph/category-edges/", CategoryEdgeViewSet.as_view(), {"HTTP_METHOD": ["GET", "POST"]}, name="shop-category-edge-list"),
    path("graph/category-edges/<str:pk>/", CategoryEdgeViewSet.as_view(), {"HTTP_METHOD": ["GET", "PUT", "DELETE"]}, name="shop-category-edge-detail"),
    path("graph/bom-edges/", BOMEdgeViewSet.as_view(), {"HTTP_METHOD": ["GET", "POST"]}, name="shop-bom-edge-list"),
    path("graph/bom-edges/<str:pk>/", BOMEdgeViewSet.as_view(), {"HTTP_METHOD": ["GET", "PUT", "DELETE"]}, name="shop-bom-edge-detail"),
]
