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
    FacilityViewSet,
    StorageLocationViewSet,
    FacilityInventoryViewSet,
    DeliveryPartnerViewSet,
    FacilityPolicyRuleViewSet,
    ReviewViewSet,
    ProductCommentViewSet,
    ProductTestimonialViewSet,
    FeedbackSummaryViewSet,
    CatalogViewSet,
    CatalogItemViewSet,
    CatalogCollectionViewSet,
    CatalogPublicationViewSet,
    TagDefinitionViewSet,
    EntityTagViewSet,
)

urlpatterns = [
    # Tag Definitions & Polymorphic Entity Tags
    path("tag-definitions/", TagDefinitionViewSet.as_view(), {"HTTP_METHOD": ["GET", "POST"]}, name="shop-tag-def-list"),
    path("tag-definitions/<str:pk>/", TagDefinitionViewSet.as_view(), {"HTTP_METHOD": ["GET", "PUT", "DELETE"]}, name="shop-tag-def-detail"),
    path("entity-tags/", EntityTagViewSet.as_view(), {"HTTP_METHOD": ["GET", "POST"]}, name="shop-entity-tag-list"),
    path("entity-tags/<str:pk>/", EntityTagViewSet.as_view(), {"HTTP_METHOD": ["GET", "PUT", "DELETE"]}, name="shop-entity-tag-detail"),

    # Catalogs & Collections
    path("catalogs/", CatalogViewSet.as_view(), {"HTTP_METHOD": ["GET", "POST"]}, name="shop-catalog-list"),
    path("catalogs/<str:pk>/", CatalogViewSet.as_view(), {"HTTP_METHOD": ["GET", "PUT", "DELETE"]}, name="shop-catalog-detail"),
    path("catalog-items/", CatalogItemViewSet.as_view(), {"HTTP_METHOD": ["GET", "POST"]}, name="shop-catalog-item-list"),
    path("catalog-items/<str:pk>/", CatalogItemViewSet.as_view(), {"HTTP_METHOD": ["GET", "PUT", "DELETE"]}, name="shop-catalog-item-detail"),
    path("catalog-collections/", CatalogCollectionViewSet.as_view(), {"HTTP_METHOD": ["GET", "POST"]}, name="shop-catalog-collection-list"),
    path("catalog-collections/<str:pk>/", CatalogCollectionViewSet.as_view(), {"HTTP_METHOD": ["GET", "PUT", "DELETE"]}, name="shop-catalog-collection-detail"),
    path("catalog-publications/", CatalogPublicationViewSet.as_view(), {"HTTP_METHOD": ["GET", "POST"]}, name="shop-catalog-publication-list"),
    path("catalog-publications/<str:pk>/", CatalogPublicationViewSet.as_view(), {"HTTP_METHOD": ["GET", "PUT", "DELETE"]}, name="shop-catalog-publication-detail"),

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

    # Multi-Location Facilities & Logistics Policies
    path("facilities/", FacilityViewSet.as_view({"get": "list", "post": "create"}), name="shop-facility-list"),
    path("facilities/<str:pk>/", FacilityViewSet.as_view({"get": "retrieve", "put": "update", "delete": "destroy"}), name="shop-facility-detail"),
    path("storage-locations/", StorageLocationViewSet.as_view({"get": "list", "post": "create"}), name="shop-storage-location-list"),
    path("facility-inventories/", FacilityInventoryViewSet.as_view({"get": "list", "post": "create"}), name="shop-facility-inventory-list"),
    path("delivery-partners/", DeliveryPartnerViewSet.as_view({"get": "list", "post": "create"}), name="shop-delivery-partner-list"),
    path("facility-policies/", FacilityPolicyRuleViewSet.as_view({"get": "list", "post": "create"}), name="shop-facility-policy-list"),

    # Polymorphic Reviews, 0.5 Ratings, Comments & Testimonials
    path("reviews/", ReviewViewSet.as_view({"get": "list", "post": "create"}), name="shop-review-list"),
    path("reviews/add/", ReviewViewSet.as_view({"post": "add_review"}), name="shop-review-add"),
    path("reviews/<str:pk>/reply/", ReviewViewSet.as_view({"post": "seller_reply"}), name="shop-review-reply"),
    path("comments/", ProductCommentViewSet.as_view({"get": "list", "post": "create"}), name="shop-comment-list"),
    path("comments/add/", ProductCommentViewSet.as_view({"post": "add_comment"}), name="shop-comment-add"),
    path("testimonials/", ProductTestimonialViewSet.as_view({"get": "list", "post": "create"}), name="shop-testimonial-list"),
    path("pdp-summary/", FeedbackSummaryViewSet.as_view({"get": "summary"}), name="shop-pdp-summary"),

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
