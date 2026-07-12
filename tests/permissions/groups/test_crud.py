import pytest

from tests.permissions.constants import GROUP_SETS


class TestGroupCreate:
    def test_create_with_keys(self, group_builder):
        keys = list(GROUP_SETS["admin_team"])
        group = group_builder.with_keys(*keys).build()
        assert group.permission_keys == keys

    def test_create_without_roles(self, group_builder):
        group = group_builder.with_keys("k:v").build()
        assert group.roles.count() == 0

    def test_create_without_keys(self, group_builder):
        group = group_builder.build()
        assert group.permission_keys == []


class TestGroupDelete:
    def test_delete_does_not_delete_roles(self, group_builder, viewer_role):
        group = group_builder.with_roles(viewer_role).build()
        group.delete()
        viewer_role.refresh_from_db()
        assert viewer_role.pk is not None


class TestGroupStr:
    def test_str(self, group_builder):
        group = group_builder.named("My Group").build()
        assert str(group) == "My Group"
