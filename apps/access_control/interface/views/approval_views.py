from django.contrib.contenttypes.models import ContentType
from rest_framework import status, permissions
from rest_framework.response import Response
from core.base_views.api_views import BaseAPIView
from core.admin.helpers.query_helpers import FilterSchema, FilterField
from apps.access_control.models import ApprovalChain, ApprovalRequest, ApprovalAction
from apps.access_control.services.approval_engine import ApprovalEngine
from apps.access_control.serializers.approval_serializers import (
    ApprovalChainListSerializer,
    ApprovalChainDetailSerializer,
    ApprovalChainCreateSerializer,
    ApprovalRequestListSerializer,
    ApprovalRequestDetailSerializer,
    ApprovalRequestSubmitSerializer,
    ApprovalActionSerializer,
    ApprovalActionCreateSerializer,
)


class ApprovalChainViewSet(BaseAPIView):
    """
    CRUD for ApprovalChain and ApprovalLevel.
    """
    permission_classes = [permissions.IsAdminUser]
    model = ApprovalChain
    list_serializer_class = ApprovalChainListSerializer
    detail_serializer_class = ApprovalChainDetailSerializer
    create_serializer_class = ApprovalChainCreateSerializer
    update_serializer_class = ApprovalChainCreateSerializer
    filter_fields = [
        ("name", "name"),
        ("approval_type", "approval_type"),
    ]
    filter_schema = FilterSchema(
        name=FilterField(type=str, lookups=["exact", "icontains"]),
        approval_type=FilterField(type=str, lookups=["exact"]),
        is_active=FilterField(type=bool),
    )

    def get_base_queryset(self):
        return ApprovalChain.objects.prefetch_related("levels").order_by("-priority")


class ApprovalRequestViewSet(BaseAPIView):
    """
    List/retrieve approval requests.
    Actions (approve/reject/escalate/cancel) are separate views.
    """
    permission_classes = [permissions.IsAuthenticated]
    model = ApprovalRequest
    list_serializer_class = ApprovalRequestListSerializer
    detail_serializer_class = ApprovalRequestDetailSerializer
    filter_fields = [
        ("status", "status"),
        ("approval_type", "chain__approval_type"),
        ("submitter", "submitter_id"),
    ]
    filter_schema = FilterSchema(
        status=FilterField(type=str, lookups=["exact"]),
        approval_type=FilterField(type=str, lookups=["exact"]),
        submitter=FilterField(type=int, lookups=["exact"]),
    )

    def get_base_queryset(self):
        user = self.platform_user
        if user.is_superuser:
            return ApprovalRequest.objects.select_related("chain", "submitter").order_by("-submitted_at")
        return ApprovalRequest.objects.filter(
            submitter=user
        ).select_related("chain", "submitter").order_by("-submitted_at")


class ApprovalSubmitView(BaseAPIView):
    """
    Submit a new approval request.
    """
    permission_classes = [permissions.IsAuthenticated]
    model = ApprovalRequest

    def post(self, request, *args, **kwargs):
        serializer = ApprovalRequestSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            app_label, model_name = data["content_type"].split(".")
            ct = ContentType.objects.get(app_label=app_label, model=model_name)
            content_object = ct.get_object_for_this_type(pk=data["object_id"])
        except (ValueError, ContentType.DoesNotExist, Exception) as e:
            return Response(
                {"error": f"Invalid content type or object: {e}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        domain_object = None
        if data.get("domain_object_id"):
            domain_object = content_object

        try:
            req = ApprovalEngine.submit(
                approval_type=data["approval_type"],
                submitter=request.user,
                content_object=content_object,
                payload=data.get("payload", {}),
                domain_object=domain_object,
            )
            return Response(
                ApprovalRequestDetailSerializer(req).data,
                status=status.HTTP_201_CREATED,
            )
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class ApprovalActionView(BaseAPIView):
    """
    Process approve/reject/escalate/cancel actions on an approval request.
    action_type is set via as_view(action_type="...") in URL conf.
    """
    permission_classes = [permissions.IsAuthenticated]
    model = ApprovalRequest
    action_type = None

    def _get_request(self, pk):
        try:
            return ApprovalRequest.objects.get(pk=pk)
        except ApprovalRequest.DoesNotExist:
            return None

    def post(self, request, pk=None, *args, **kwargs):
        req = self._get_request(pk)
        if not req:
            return Response(
                {"error": "Approval request not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = ApprovalActionCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        comment = serializer.validated_data.get("comment", "")

        action_type = self.action_type
        try:
            if action_type == "approve":
                action = ApprovalEngine.approve(req, request.user, comment)
            elif action_type == "reject":
                action = ApprovalEngine.reject(req, request.user, comment)
            elif action_type == "escalate":
                action = ApprovalEngine.escalate(req, request.user, comment)
            elif action_type == "cancel":
                ApprovalEngine.cancel(req, request.user, comment)
                return Response({"status": "cancelled"}, status=status.HTTP_200_OK)
            else:
                return Response(
                    {"error": f"Unknown action: {action_type}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            return Response(
                ApprovalActionSerializer(action).data,
                status=status.HTTP_200_OK,
            )
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
