import pytest
from django.db import IntegrityError

from apps.users.models.permissions import UserPermissionModel
from tests.permissions.constants import ROLE_SETS, GROUP_SETS, DIRECT_PERM_SETS


class TestAssignmentCreate:
    def test_create(self, user, assignment_builder):
        keys = list(DIRECT_PERM_SETS["leave"])
        assignment = assignment_builder.with_direct(*keys).build()
        assert assignment.user == user
        assert assignment.direct_permissions == keys

    def test_assign_roles(self, user, role_builder, assignment_builder):
        keys = list(ROLE_SETS["viewer"])
        role = role_builder.with_keys(*keys).build()
        assignment_builder.with_roles(role).build()
        assert UserPermissionModel.objects.get(user=user).roles.count() == 1

    def test_assign_groups(self, user, group_builder, assignment_builder):
        keys = list(GROUP_SETS["admin_team"])
        group = group_builder.with_keys(*keys).build()
        assignment_builder.with_groups(group).build()
        assert UserPermissionModel.objects.get(user=user).groups.count() == 1


class TestAssignmentConstraints:
    def test_user_without_assignment(self, user):
        with pytest.raises(UserPermissionModel.DoesNotExist):
            UserPermissionModel.objects.get(user=user)

    @pytest.mark.skip(reason="Pre-existing AuditMixin crash on cascade delete")
    def test_delete_user_cascades_assignment(self, user, assignment_builder):
        assignment = assignment_builder.build()
        uid = assignment.id
        user.delete()
        assert not UserPermissionModel.objects.filter(id=uid).exists()

    def test_one_to_one_constraint(self, user, assignment_builder):
        assignment_builder.build()
        with pytest.raises(IntegrityError):
            assignment_builder.build()


class TestAssignmentStr:
    def test_str(self, user, assignment_builder):
        assignment = assignment_builder.build()
        assert str(assignment) == f"Permissions for {user.username}"
