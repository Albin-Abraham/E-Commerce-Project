from django.contrib.contenttypes.models import ContentType
from rest_framework import serializers

from apps.access_control.models import FieldAccessPolicy, PolicyConfiguration
from core.base_serializers.base_serializers import BaseModelSerializer


class PolymorphicGFKSerializerMixin:
    """
    Mixin for serializers to handle models with Generic Foreign Keys (GFK),
    translating clean JSON representation payloads (e.g. {"type": "user", "id": "123"})
    to database ContentType/ID mappings, and formatting them back for read responses.
    """

    def get_gfk_representation(self, obj, field_name_prefix):
        """
        Formats a GFK relation (e.g. subject or scope) for read operations.
        """
        content_type = getattr(obj, f"{field_name_prefix}_type")
        object_id = getattr(obj, f"{field_name_prefix}_id")

        if not content_type or not object_id:
            return None

        instance = getattr(obj, field_name_prefix)
        display_label = str(instance) if instance else f"{content_type.model} [{object_id}]"

        return {"type": content_type.model, "id": object_id, "display": display_label}

    def validate_gfk_input(self, data, field_name_prefix, required=False):
        """
        Validates GFK string input from a request.
        Converts it to ContentType and validates the target object exists.
        """
        type_key = f"{field_name_prefix}_type"
        id_key = f"{field_name_prefix}_id"

        type_val = data.get(type_key)
        id_val = data.get(id_key)

        if not type_val and not id_val:
            if required:
                raise serializers.ValidationError(
                    {field_name_prefix: f"Both {type_key} and {id_key} are required."}
                )
            return data

        if not type_val or not id_val:
            raise serializers.ValidationError(
                {field_name_prefix: f"Both {type_key} and {id_key} must be provided together."}
            )

        try:
            content_type = ContentType.objects.get(model=type_val.lower())
        except ContentType.DoesNotExist:
            raise serializers.ValidationError(
                {type_key: f"ContentType with model name '{type_val}' does not exist."}
            )

        model_class = content_type.model_class()
        try:
            model_class.objects.get(pk=id_val)
        except (model_class.DoesNotExist, ValueError, TypeError):
            raise serializers.ValidationError(
                {id_key: f"No instance of {type_val} found with ID '{id_val}'."}
            )

        data[f"{field_name_prefix}_type"] = content_type
        data[f"{field_name_prefix}_id"] = str(id_val)
        return data


class PolicyConfigurationSerializer(PolymorphicGFKSerializerMixin, BaseModelSerializer):
    subject = serializers.SerializerMethodField()
    scope = serializers.SerializerMethodField()

    subject_type = serializers.CharField(write_only=True)
    subject_id = serializers.CharField(write_only=True)

    scope_type = serializers.CharField(write_only=True, required=False, allow_null=True)
    scope_id = serializers.CharField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = PolicyConfiguration
        fields = [
            "id",
            "policy",
            "version",
            "subject",
            "subject_type",
            "subject_id",
            "action",
            "effect",
            "scope",
            "scope_type",
            "scope_id",
            "conditions",
            "status",
        ]

    def get_subject(self, obj):
        return self.get_gfk_representation(obj, "subject")

    def get_scope(self, obj):
        return self.get_gfk_representation(obj, "scope")

    def validate(self, attrs):
        attrs = self.validate_gfk_input(attrs, "subject", required=True)
        attrs = self.validate_gfk_input(attrs, "scope", required=False)
        return super().validate(attrs)


class FieldAccessPolicySerializer(BaseModelSerializer):
    configurations = PolicyConfigurationSerializer(many=True, read_only=True)
    content_type_name = serializers.SerializerMethodField()

    class Meta:
        model = FieldAccessPolicy
        fields = [
            "id",
            "name",
            "description",
            "content_type",
            "content_type_name",
            "field_name",
            "approval_chain",
            "is_active",
            "configurations",
        ]

    def get_content_type_name(self, obj):
        return obj.content_type.model if obj.content_type else None
