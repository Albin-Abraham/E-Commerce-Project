from django.contrib.contenttypes.models import ContentType
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from core.base_views.api_views import BaseAPIView
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
    queryset = ApprovalChain.objects.all()
    serializer_class = ApprovalChainListSerializer
    filter_fields = [
        ("name", "name"),
        ("approval_type", "approval_type"),
        ("is_active", "is_active"),
    ]

    list_serializer_class = ApprovalChainListSerializer
    detail_serializer_class = ApprovalChainDetailSerializer
    create_serializer_class = ApprovalChainCreateSerializer
    update_serializer_class = ApprovalChainCreateSerializer

    def get_queryset(self):
        return ApprovalChain.objects.prefetch_related("levels").order_by("-priority")


class ApprovalRequestViewSet(BaseAPIView):
    """
    Manage approval requests: submit, list, retrieve, approve, reject, escalate, cancel.
    """
    permission_classes = [permissions.IsAuthenticated]
    queryset = ApprovalRequest.objects.all()
    serializer_class = ApprovalRequestListSerializer
    filter_fields = [
        ("status", "status"),
        ("approval_type", "chain__approval_type"),
        ("submitter", "submitter_id"),
    ]

    list_serializer_class = ApprovalRequestListSerializer
    detail_serializer_class = ApprovalRequestDetailSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return ApprovalRequest.objects.select_related("chain", "submitter").order_by("-submitted_at")
        # Regular users see their own requests
        return ApprovalRequest.objects.filter(
            submitter=user
        ).select_related("chain", "submitter").order_by("-submitted_at")

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        req = self.get_object()
        serializer = ApprovalActionCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        comment = serializer.validated_data.get("comment", "")
        try:
            action = ApprovalEngine.approve(req, request.user, comment)
            return Response(
                ApprovalActionSerializer(action).data,
                status=status.HTTP_200_OK,
            )
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        req = self.get_object()
        serializer = ApprovalActionCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        comment = serializer.validated_data.get("comment", "")
        try:
            action = ApprovalEngine.reject(req, request.user, comment)
            return Response(
                ApprovalActionSerializer(action).data,
                status=status.HTTP_200_OK,
            )
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["post"])
    def escalate(self, request, pk=None):
        req = self.get_object()
        serializer = ApprovalActionCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        comment = serializer.validated_data.get("comment", "")
        try:
            action = ApprovalEngine.escalate(req, request.user, comment)
            return Response(
                ApprovalActionSerializer(action).data,
                status=status.HTTP_200_OK,
            )
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["post"], url_path="cancel")
    def cancel_action(self, request, pk=None):
        req = self.get_object()
        serializer = ApprovalActionCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        comment = serializer.validated_data.get("comment", "")
        try:
            ApprovalEngine.cancel(req, request.user, comment)
            return Response({"status": "cancelled"}, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class ApprovalSubmitView(BaseAPIView):
    """
    Submit a new approval request.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ApprovalRequestSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # Resolve the content object
        try:
            app_label, model_name = data["content_type"].split(".")
            ct = ContentType.objects.get(app_label=app_label, model=model_name)
            content_object = ct.get_object_for_this_type(pk=data["object_id"])
        except (ValueError, ContentType.DoesNotExist, Exception) as e:
            return Response(
                {"error": f"Invalid content type or object: {e}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Resolve domain object if provided
        domain_object = None
        if data.get("domain_object_id"):
            domain_object = content_object  # Simplified — extend as needed

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
