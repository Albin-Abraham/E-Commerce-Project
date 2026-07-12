from rest_framework import serializers
from core.base_serializers.base_serializers import BaseModelSerializer
from apps.access_control.models import (
    ApprovalChain,
    ApprovalLevel,
    ApprovalRequest,
    ApprovalAction,
)


# --- ApprovalChain Serializers ---

class ApprovalChainListSerializer(BaseModelSerializer):
    class Meta:
        model = ApprovalChain
        fields = ["id", "name", "approval_type", "priority", "is_active", "created_at"]
        read_only_fields = ["id", "created_at"]


class ApprovalLevelInlineSerializer(BaseModelSerializer):
    class Meta:
        model = ApprovalLevel
        fields = [
            "id", "level", "approver_by_type", "approver_type", "approver_id",
            "fallback_approver_by_type", "fallback_approver_type", "fallback_approver_id",
            "allow_direct_approval", "is_optional", "timeout_hours", "timeout_action",
            "can_edit_request",
        ]
        read_only_fields = ["id"]


class ApprovalChainDetailSerializer(BaseModelSerializer):
    levels = ApprovalLevelInlineSerializer(many=True, read_only=True)

    class Meta:
        model = ApprovalChain
        fields = [
            "id", "name", "approval_type", "conditions", "priority",
            "allow_higher_level_override", "domain_type", "domain_id",
            "chain_auto_action", "is_active", "levels", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class ApprovalChainCreateSerializer(BaseModelSerializer):
    class Meta:
        model = ApprovalChain
        fields = [
            "id", "name", "approval_type", "conditions", "priority",
            "allow_higher_level_override", "domain_type", "domain_id",
            "chain_auto_action", "is_active",
        ]
        read_only_fields = ["id"]


# --- ApprovalRequest Serializers ---

class ApprovalRequestListSerializer(BaseModelSerializer):
    chain_name = serializers.CharField(source="chain.name", read_only=True)
    submitter_display = serializers.CharField(source="submitter.username", read_only=True)

    class Meta:
        model = ApprovalRequest
        fields = [
            "id", "chain", "chain_name", "submitter", "submitter_display",
            "status", "current_level", "submitted_at", "resolved_at",
        ]
        read_only_fields = ["id", "submitted_at"]


class ApprovalRequestDetailSerializer(BaseModelSerializer):
    chain_name = serializers.CharField(source="chain.name", read_only=True)
    submitter_display = serializers.CharField(source="submitter.username", read_only=True)
    actions = serializers.SerializerMethodField()

    class Meta:
        model = ApprovalRequest
        fields = [
            "id", "chain", "chain_name", "submitter", "submitter_display",
            "content_type", "object_id", "status", "current_level",
            "payload", "decision_comment", "submitted_at", "resolved_at", "actions",
        ]
        read_only_fields = ["id", "submitted_at"]

    def get_actions(self, obj):
        actions = obj.actions.order_by("created_at")
        return ApprovalActionSerializer(actions, many=True).data


class ApprovalRequestSubmitSerializer(serializers.Serializer):
    """Serializer for submitting a new approval request."""
    approval_type = serializers.CharField(max_length=100)
    content_type = serializers.CharField(max_length=100, help_text="e.g., 'shop.order'")
    object_id = serializers.CharField(max_length=50)
    payload = serializers.JSONField(required=False, default=dict)
    domain_object_id = serializers.CharField(max_length=50, required=False, default=None)


# --- ApprovalAction Serializers ---

class ApprovalActionSerializer(BaseModelSerializer):
    approver_display = serializers.CharField(source="approver.username", read_only=True)

    class Meta:
        model = ApprovalAction
        fields = [
            "id", "request", "approver", "approver_display",
            "action_type", "comment", "level", "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class ApprovalActionCreateSerializer(serializers.Serializer):
    """Serializer for approve/reject/escalate actions."""
    comment = serializers.CharField(required=False, default="", allow_blank=True)
