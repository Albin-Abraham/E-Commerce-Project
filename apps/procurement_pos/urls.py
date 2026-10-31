from django.urls import path

from apps.procurement_pos.views import (
    GoodsReceivedNoteViewSet,
    POSProductLookupView,
    POSRegisterViewSet,
    POSSessionViewSet,
    POSTransactionViewSet,
    PurchaseOrderViewSet,
    SupplierViewSet,
    VendorRegistrationView,
)

urlpatterns = [
    # Procurement
    path(
        "suppliers/register/",
        VendorRegistrationView.as_view(),
        {"HTTP_METHOD": ["POST"]},
        name="procurement-vendor-register",
    ),
    path(
        "suppliers/",
        SupplierViewSet.as_view(),
        {"HTTP_METHOD": ["GET", "POST"]},
        name="procurement-supplier-list",
    ),
    path(
        "suppliers/<str:pk>/",
        SupplierViewSet.as_view(),
        {"HTTP_METHOD": ["GET", "PUT", "DELETE"]},
        name="procurement-supplier-detail",
    ),
    path(
        "purchase-orders/",
        PurchaseOrderViewSet.as_view(),
        {"HTTP_METHOD": ["GET", "POST"]},
        name="procurement-po-list",
    ),
    path(
        "purchase-orders/<str:pk>/",
        PurchaseOrderViewSet.as_view(),
        {"HTTP_METHOD": ["GET", "PUT", "DELETE"]},
        name="procurement-po-detail",
    ),
    path(
        "grn/",
        GoodsReceivedNoteViewSet.as_view(),
        {"HTTP_METHOD": ["GET", "POST"]},
        name="procurement-grn-list",
    ),
    path(
        "grn/<str:pk>/",
        GoodsReceivedNoteViewSet.as_view(),
        {"HTTP_METHOD": ["GET", "POST", "PUT", "DELETE"]},
        name="procurement-grn-detail",
    ),
    # POS
    path(
        "pos/registers/",
        POSRegisterViewSet.as_view(),
        {"HTTP_METHOD": ["GET", "POST"]},
        name="pos-register-list",
    ),
    path(
        "pos/registers/<str:pk>/",
        POSRegisterViewSet.as_view(),
        {"HTTP_METHOD": ["GET", "PUT", "DELETE"]},
        name="pos-register-detail",
    ),
    path(
        "pos/registers/<str:register_id>/product-lookup/",
        POSProductLookupView.as_view(),
        name="pos-product-lookup",
    ),
    path(
        "pos/sessions/",
        POSSessionViewSet.as_view(),
        {"HTTP_METHOD": ["GET", "POST"]},
        name="pos-session-list",
    ),
    path(
        "pos/sessions/<str:pk>/",
        POSSessionViewSet.as_view(),
        {"HTTP_METHOD": ["GET", "PUT", "DELETE"]},
        name="pos-session-detail",
    ),
    path(
        "pos/transactions/",
        POSTransactionViewSet.as_view(),
        {"HTTP_METHOD": ["GET", "POST"]},
        name="pos-transaction-list",
    ),
    path(
        "pos/transactions/<str:pk>/",
        POSTransactionViewSet.as_view(),
        {"HTTP_METHOD": ["GET", "PUT", "DELETE"]},
        name="pos-transaction-detail",
    ),
]
