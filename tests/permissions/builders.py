import uuid
from typing import List

from django.contrib.auth import get_user_model
from apps.users.models.permissions import RolePermissions, RoleGroupPermissions, UserPermissionModel
from apps.users.models.catalog import BranchCatalog
from core.admin.models import Company

User = get_user_model()


def _unique_name(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:8]}"


class RoleBuilder:
    def __init__(self):
        self.name = _unique_name("role")
        self.description = ""
        self.permission_keys: List[str] = []

    def with_keys(self, *keys: str) -> "RoleBuilder":
        self.permission_keys = list(keys)
        return self

    def named(self, name: str) -> "RoleBuilder":
        self.name = name
        return self

    def build(self) -> RolePermissions:
        return RolePermissions.objects.create(
            name=self.name,
            description=self.description,
            permission_keys=self.permission_keys,
        )


class GroupBuilder:
    def __init__(self):
        self.name = _unique_name("group")
        self.permission_keys: List[str] = []
        self._roles: List[RolePermissions] = []

    def with_keys(self, *keys: str) -> "GroupBuilder":
        self.permission_keys = list(keys)
        return self

    def named(self, name: str) -> "GroupBuilder":
        self.name = name
        return self

    def with_roles(self, *roles: RolePermissions) -> "GroupBuilder":
        self._roles = list(roles)
        return self

    def build(self) -> RoleGroupPermissions:
        group = RoleGroupPermissions.objects.create(
            name=self.name,
            permission_keys=self.permission_keys,
        )
        if self._roles:
            group.roles.add(*self._roles)
        return group


class AssignmentBuilder:
    def __init__(self, user):
        self.user = user
        self.direct_permissions: List[str] = []
        self._roles: List[RolePermissions] = []
        self._groups: List[RoleGroupPermissions] = []

    def with_direct(self, *keys: str) -> "AssignmentBuilder":
        self.direct_permissions = list(keys)
        return self

    def with_roles(self, *roles: RolePermissions) -> "AssignmentBuilder":
        self._roles = list(roles)
        return self

    def with_groups(self, *groups: RoleGroupPermissions) -> "AssignmentBuilder":
        self._groups = list(groups)
        return self

    def build(self) -> UserPermissionModel:
        assignment = UserPermissionModel.objects.create(
            user=self.user,
            direct_permissions=self.direct_permissions,
        )
        if self._roles:
            assignment.roles.add(*self._roles)
        if self._groups:
            assignment.groups.add(*self._groups)
        return assignment


class CatalogBuilder:
    def __init__(self):
        self.name = _unique_name("catalog")
        self.module_keys: List[str] = []
        self.allowed_permission_keys: List[str] = []

    def named(self, name: str) -> "CatalogBuilder":
        self.name = name
        return self

    def with_modules(self, *modules: str) -> "CatalogBuilder":
        self.module_keys = list(modules)
        return self

    def with_keys(self, *keys: str) -> "CatalogBuilder":
        self.allowed_permission_keys = list(keys)
        return self

    def build(self) -> BranchCatalog:
        """Persists via save() which triggers full_clean(). Use for valid data."""
        return BranchCatalog.objects.create(
            name=self.name,
            module_keys=self.module_keys,
            allowed_permission_keys=self.allowed_permission_keys,
        )

    def build_instance(self) -> BranchCatalog:
        """Returns unsaved instance for validation-failure tests."""
        return BranchCatalog(
            name=self.name,
            module_keys=self.module_keys,
            allowed_permission_keys=self.allowed_permission_keys,
        )


class CompanyBuilder:
    def __init__(self):
        self.name = _unique_name("co")

    def build(self) -> Company:
        return Company.objects.create(name=self.name)


class UserBuilder:
    def __init__(self):
        self.username = _unique_name("u")
        self.email = f"{self.username}@test.com"
        self.password = "p"
        self.is_superuser = False

    def as_superuser(self) -> "UserBuilder":
        self.is_superuser = True
        return self

    def build(self):
        return User.objects.create_user(
            username=self.username,
            email=self.email,
            password=self.password,
            is_superuser=self.is_superuser,
        )
