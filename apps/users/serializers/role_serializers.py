from rest_framework import serializers
from core.base_serializers.base_serializers import BaseModelSerializer
from apps.users.models.permissions import RolePermissions


class RoleListSerializer(BaseModelSerializer):
    class Meta:
        model = RolePermissions
        fields = ["id", "name", "description", "permission_keys", "created_at"]
        read_only_fields = ["id", "created_at"]


class RoleDetailSerializer(BaseModelSerializer):
    class Meta:
        model = RolePermissions
        fields = ["id", "name", "description", "permission_keys", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_permission_keys(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("permission_keys must be a list.")
        for key in value:
            if not isinstance(key, str):
                raise serializers.ValidationError(f"Permission key must be a string: {key}")
        return value


class RoleCreateSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)

    class Meta:
        model = RolePermissions
        fields = ["id", "name", "description", "permission_keys"]

    def validate_name(self, value):
        if RolePermissions.objects.filter(name=value).exists():
            raise serializers.ValidationError("Role name already exists.")
        return value

    def validate_permission_keys(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("permission_keys must be a list.")
        return value
