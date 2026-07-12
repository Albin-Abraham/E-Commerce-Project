from datetime import datetime
from rest_framework.permissions import IsAdminUser
from core.base_views.api_views import BaseAPIView
from core.admin.helpers.query_helpers import FilterSchema, FilterField
from apps.users.models.users import UserModel
from apps.users.serializers.user_serializers import (
    UserListSerializer,
    UserDetailSerializer,
    UserCreateSerializer,
    UserUpdateSerializer,
)


class UserManagementViewSet(BaseAPIView):
    model = UserModel
    entity_name = "User"
    view_id = "USER_MANAGEMENT"

    paginate = True
    supports_soft_delete = True

    search_fields = ["email", "username", "full_name"]
    filter_fields = [("is_active", "is_active"), ("is_staff", "is_staff")]
    filter_schema = FilterSchema(
        is_active=FilterField(type=bool),
        is_staff=FilterField(type=bool),
        email=FilterField(type=str, lookups=["exact", "icontains"]),
        username=FilterField(type=str, lookups=["exact", "icontains"]),
        full_name=FilterField(type=str, lookups=["exact", "icontains"]),
        date_joined=FilterField(type=datetime, lookups=["exact", "gte", "lte"]),
    )
    orderby = "-date_joined"

    list_serializer_class = UserListSerializer
    detail_serializer_class = UserDetailSerializer
    create_serializer_class = UserCreateSerializer
    update_serializer_class = UserUpdateSerializer


class UserDeactivateView(BaseAPIView):
    model = UserModel
    entity_name = "User"
    permission_classes = [IsAdminUser]
    http_method_names = ["post"]

    def post(self, request, pk=None, *args, **kwargs):
        user = self.get_object(pk)
        if not user:
            from core.admin.helpers.response_helpers import ResponseFactory
            return ResponseFactory.not_found("User not found")
        user.is_active = False
        user.save()
        from core.admin.helpers.response_helpers import ResponseFactory
        return ResponseFactory.success(message="User deactivated.", data={"user_id": str(user.id)})


class UserActivateView(BaseAPIView):
    model = UserModel
    entity_name = "User"
    permission_classes = [IsAdminUser]
    http_method_names = ["post"]

    def post(self, request, pk=None, *args, **kwargs):
        user = self.get_object(pk)
        if not user:
            from core.admin.helpers.response_helpers import ResponseFactory
            return ResponseFactory.not_found("User not found")
        user.is_active = True
        user.save()
        from core.admin.helpers.response_helpers import ResponseFactory
        return ResponseFactory.success(message="User activated.", data={"user_id": str(user.id)})


class UserResetPasswordView(BaseAPIView):
    model = UserModel
    entity_name = "User"
    permission_classes = [IsAdminUser]
    http_method_names = ["post"]

    def post(self, request, pk=None, *args, **kwargs):
        user = self.get_object(pk)
        if not user:
            from core.admin.helpers.response_helpers import ResponseFactory
            return ResponseFactory.not_found("User not found")

        import secrets
        import string
        alphabet = string.ascii_letters + string.digits
        new_password = "".join(secrets.choice(alphabet) for _ in range(12))

        user.set_password(new_password)
        user.save()

        from core.admin.helpers.response_helpers import ResponseFactory
        return ResponseFactory.success(
            message="Password reset successfully.",
            data={"new_password": new_password},
        )


class UserAssignRoleView(BaseAPIView):
    model = UserModel
    entity_name = "User"
    permission_classes = [IsAdminUser]
    http_method_names = ["post"]

    def post(self, request, pk=None, *args, **kwargs):
        user = self.get_object(pk)
        if not user:
            from core.admin.helpers.response_helpers import ResponseFactory
            return ResponseFactory.not_found("User not found")

        role_id = request.data.get("role_id")
        if not role_id:
            from core.admin.helpers.response_helpers import ResponseFactory
            return ResponseFactory.error(message="role_id is required.")

        from apps.users.models.permissions import RolePermissions, UserPermissionModel
        try:
            role = RolePermissions.objects.get(id=role_id)
        except RolePermissions.DoesNotExist:
            from core.admin.helpers.response_helpers import ResponseFactory
            return ResponseFactory.not_found("Role not found.")

        perm_model, _ = UserPermissionModel.objects.get_or_create(user=user)
        perm_model.roles.add(role)

        from core.admin.helpers.response_helpers import ResponseFactory
        return ResponseFactory.success(
            message=f"Role '{role.name}' assigned.",
            data={"role_id": str(role.id)},
        )


class UserRemoveRoleView(BaseAPIView):
    model = UserModel
    entity_name = "User"
    permission_classes = [IsAdminUser]
    http_method_names = ["delete"]

    def delete(self, request, pk=None, role_id=None, *args, **kwargs):
        user = self.get_object(pk)
        if not user:
            from core.admin.helpers.response_helpers import ResponseFactory
            return ResponseFactory.not_found("User not found")

        from apps.users.models.permissions import RolePermissions, UserPermissionModel
        try:
            role = RolePermissions.objects.get(id=role_id)
        except RolePermissions.DoesNotExist:
            from core.admin.helpers.response_helpers import ResponseFactory
            return ResponseFactory.not_found("Role not found.")

        try:
            perm_model = UserPermissionModel.objects.get(user=user)
            perm_model.roles.remove(role)
        except UserPermissionModel.DoesNotExist:
            pass

        from core.admin.helpers.response_helpers import ResponseFactory
        return ResponseFactory.success(message=f"Role '{role.name}' removed.")


class UserAssignGroupView(BaseAPIView):
    model = UserModel
    entity_name = "User"
    permission_classes = [IsAdminUser]
    http_method_names = ["post"]

    def post(self, request, pk=None, *args, **kwargs):
        user = self.get_object(pk)
        if not user:
            from core.admin.helpers.response_helpers import ResponseFactory
            return ResponseFactory.not_found("User not found")

        group_id = request.data.get("group_id")
        if not group_id:
            from core.admin.helpers.response_helpers import ResponseFactory
            return ResponseFactory.error(message="group_id is required.")

        from apps.users.models.permissions import RoleGroupPermissions, UserPermissionModel
        try:
            group = RoleGroupPermissions.objects.get(id=group_id)
        except RoleGroupPermissions.DoesNotExist:
            from core.admin.helpers.response_helpers import ResponseFactory
            return ResponseFactory.not_found("Group not found.")

        perm_model, _ = UserPermissionModel.objects.get_or_create(user=user)
        perm_model.groups.add(group)

        from core.admin.helpers.response_helpers import ResponseFactory
        return ResponseFactory.success(
            message=f"Group '{group.name}' assigned.",
            data={"group_id": str(group.id)},
        )


class UserRemoveGroupView(BaseAPIView):
    model = UserModel
    entity_name = "User"
    permission_classes = [IsAdminUser]
    http_method_names = ["delete"]

    def delete(self, request, pk=None, group_id=None, *args, **kwargs):
        user = self.get_object(pk)
        if not user:
            from core.admin.helpers.response_helpers import ResponseFactory
            return ResponseFactory.not_found("User not found")

        from apps.users.models.permissions import RoleGroupPermissions, UserPermissionModel
        try:
            group = RoleGroupPermissions.objects.get(id=group_id)
        except RoleGroupPermissions.DoesNotExist:
            from core.admin.helpers.response_helpers import ResponseFactory
            return ResponseFactory.not_found("Group not found.")

        try:
            perm_model = UserPermissionModel.objects.get(user=user)
            perm_model.groups.remove(group)
        except UserPermissionModel.DoesNotExist:
            pass

        from core.admin.helpers.response_helpers import ResponseFactory
        return ResponseFactory.success(message=f"Group '{group.name}' removed.")


class UserSetPermissionsView(BaseAPIView):
    model = UserModel
    entity_name = "User"
    permission_classes = [IsAdminUser]
    http_method_names = ["post"]

    def post(self, request, pk=None, *args, **kwargs):
        user = self.get_object(pk)
        if not user:
            from core.admin.helpers.response_helpers import ResponseFactory
            return ResponseFactory.not_found("User not found")

        direct_permissions = request.data.get("direct_permissions", [])
        if not isinstance(direct_permissions, list):
            from core.admin.helpers.response_helpers import ResponseFactory
            return ResponseFactory.error(message="direct_permissions must be a list.")

        from apps.users.models.permissions import UserPermissionModel
        perm_model, _ = UserPermissionModel.objects.get_or_create(user=user)
        perm_model.direct_permissions = direct_permissions
        perm_model.save()

        from core.admin.helpers.response_helpers import ResponseFactory
        return ResponseFactory.success(
            message="Direct permissions updated.",
            data={"permissions": direct_permissions},
        )
