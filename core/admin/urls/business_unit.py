from django.urls import path
from core.admin.views.business_unit_views import BusinessUnitAPIView

urlpatterns = [
    path('', BusinessUnitAPIView.as_view(), {"HTTP_METHOD": ["GET", "POST"]}, name='business-unit-list'),
    path('<str:pk>/', BusinessUnitAPIView.as_view(), {"HTTP_METHOD": ["GET", "PUT", "DELETE"]}, name='business-unit-detail'),
]
