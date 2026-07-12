from rest_framework import serializers
from django.contrib.auth import get_user_model
from core.base_serializers.base_serializers import BaseModelSerializer
from apps.users.models.users import UserProfileModel
from apps.users.models.permissions import RolePermissions, RoleGroupPermissions, UserPermissionModel

User = get_user_model()


class UserProfileSerializer(BaseModelSerializer):
    class Meta:
        model = UserProfileModel
        fields = ["company", "branch"]


class UserListSerializer(BaseModelSerializer):
    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = [
            "id", "email", "username", "full_name",
            "is_active", "is_staff", "date_joined", "profile",
        ]
        read_only_fields = ["id", "date_joined"]


class UserDetailSerializer(BaseModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    roles = serializers.SerializerMethodField()
    groups = serializers.SerializerMethodField()
    direct_permissions = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id", "email", "username", "full_name",
            "is_active", "is_staff", "date_joined",
            "profile", "roles", "groups", "direct_permissions",
        ]
        read_only_fields = ["id", "date_joined"]

    def get_roles(self, obj):
        try:
            perm_model = UserPermissionModel.objects.get(user=obj)
            return [{"id": str(r.id), "name": r.name} for r in perm_model.roles.all()]
        except UserPermissionModel.DoesNotExist:
            return []

    def get_groups(self, obj):
        try:
            perm_model = UserPermissionModel.objects.get(user=obj)
            return [{"id": str(g.id), "name": g.name} for g in perm_model.groups.all()]
        except UserPermissionModel.DoesNotExist:
            return []

    def get_direct_permissions(self, obj):
        try:
            perm_model = UserPermissionModel.objects.get(user=obj)
            return perm_model.direct_permissions
        except UserPermissionModel.DoesNotExist:
            return []


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    full_name = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ["email", "username", "password", "full_name", "is_active", "is_staff"]

    def create(self, validated_data):
        from apps.users.services.auth_service import AuthService
        return AuthService.register_user(validated_data)


class UserUpdateSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ["email", "username", "full_name", "is_active", "is_staff"]
        read_only_fields = ["id"]

    def validate_email(self, value):
        user = self.instance
        if User.objects.filter(email=value).exclude(pk=user.pk).exists():
            raise serializers.ValidationError("Email already in use.")
        return value

    def validate_username(self, value):
        user = self.instance
        if User.objects.filter(username=value).exclude(pk=user.pk).exists():
            raise serializers.ValidationError("Username already in use.")
        return value
