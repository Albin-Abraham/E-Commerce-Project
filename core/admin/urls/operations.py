from django.urls import path

from core.admin.views.operation_views import OperationStatusView

urlpatterns = [
    path("operations/<uuid:task_id>/", OperationStatusView.as_view(http_method_names=["get"]), name="operation-status"),
]
