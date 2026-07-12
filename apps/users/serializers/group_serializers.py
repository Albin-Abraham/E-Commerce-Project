from rest_framework import serializers
from core.base_serializers.base_serializers import BaseModelSerializer
from apps.users.models.permissions import RoleGroupPermissions, RolePermissions


class RoleNestedSerializer(BaseModelSerializer):
    class Meta:
        model = RolePermissions
        fields = ["id", "name"]
        read_only_fields = ["id"]


class GroupListSerializer(BaseModelSerializer):
    class Meta:
        model = RoleGroupPermissions
        fields = ["id", "name", "permission_keys", "created_at"]
        read_only_fields = ["id", "created_at"]


class GroupDetailSerializer(BaseModelSerializer):
    roles = RoleNestedSerializer(many=True, read_only=True)

    class Meta:
        model = RoleGroupPermissions
        fields = ["id", "name", "roles", "permission_keys", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_permission_keys(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("permission_keys must be a list.")
        for key in value:
            if not isinstance(key, str):
                raise serializers.ValidationError(f"Permission key must be a string: {key}")
        return value


class GroupCreateSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    role_ids = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        allow_empty=True,
    )

    class Meta:
        model = RoleGroupPermissions
        fields = ["id", "name", "permission_keys", "role_ids"]

    def validate_name(self, value):
        if RoleGroupPermissions.objects.filter(name=value).exists():
            raise serializers.ValidationError("Group name already exists.")
        return value

    def validate_permission_keys(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("permission_keys must be a list.")
        return value

    def validate_role_ids(self, value):
        if value:
            roles = RolePermissions.objects.filter(id__in=value)
            if roles.count() != len(value):
                raise serializers.ValidationError("One or more role IDs are invalid.")
        return value

    def create(self, validated_data):
        role_ids = validated_data.pop("role_ids", [])
        instance = RoleGroupPermissions.objects.create(**validated_data)
        if role_ids:
            roles = RolePermissions.objects.filter(id__in=role_ids)
            instance.roles.set(roles)
        return instance
