from django.urls import path
from apps.procurement_pos.views import (
    SupplierViewSet,
    PurchaseOrderViewSet,
    GoodsReceivedNoteViewSet,
    POSRegisterViewSet,
    POSSessionViewSet,
    POSTransactionViewSet,
)

urlpatterns = [
    # Procurement
    path("suppliers/", SupplierViewSet.as_view(), {"HTTP_METHOD": ["GET", "POST"]}, name="procurement-supplier-list"),
    path("suppliers/<str:pk>/", SupplierViewSet.as_view(), {"HTTP_METHOD": ["GET", "PUT", "DELETE"]}, name="procurement-supplier-detail"),
    path("purchase-orders/", PurchaseOrderViewSet.as_view(), {"HTTP_METHOD": ["GET", "POST"]}, name="procurement-po-list"),
    path("purchase-orders/<str:pk>/", PurchaseOrderViewSet.as_view(), {"HTTP_METHOD": ["GET", "PUT", "DELETE"]}, name="procurement-po-detail"),
    path("grn/", GoodsReceivedNoteViewSet.as_view(), {"HTTP_METHOD": ["GET", "POST"]}, name="procurement-grn-list"),
    path("grn/<str:pk>/", GoodsReceivedNoteViewSet.as_view(), {"HTTP_METHOD": ["GET", "POST", "PUT", "DELETE"]}, name="procurement-grn-detail"),

    # POS
    path("pos/registers/", POSRegisterViewSet.as_view(), {"HTTP_METHOD": ["GET", "POST"]}, name="pos-register-list"),
    path("pos/registers/<str:pk>/", POSRegisterViewSet.as_view(), {"HTTP_METHOD": ["GET", "PUT", "DELETE"]}, name="pos-register-detail"),
    path("pos/sessions/", POSSessionViewSet.as_view(), {"HTTP_METHOD": ["GET", "POST"]}, name="pos-session-list"),
    path("pos/sessions/<str:pk>/", POSSessionViewSet.as_view(), {"HTTP_METHOD": ["GET", "PUT", "DELETE"]}, name="pos-session-detail"),
    path("pos/transactions/", POSTransactionViewSet.as_view(), {"HTTP_METHOD": ["GET", "POST"]}, name="pos-transaction-list"),
    path("pos/transactions/<str:pk>/", POSTransactionViewSet.as_view(), {"HTTP_METHOD": ["GET", "PUT", "DELETE"]}, name="pos-transaction-detail"),
]
