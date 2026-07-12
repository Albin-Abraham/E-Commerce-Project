import pytest
from django.db import IntegrityError

from tests.permissions.constants import ROLE_SETS


class TestRoleCreate:
    def test_create_with_keys(self, role_builder):
        keys = list(ROLE_SETS["viewer"])
        role = role_builder.with_keys(*keys).build()
        assert role.permission_keys == keys

    def test_create_with_empty_keys(self, role_builder):
        role = role_builder.with_keys().build()
        assert role.permission_keys == []

    def test_duplicate_name_raises(self, role_builder):
        role_builder.named("Unique").build()
        with pytest.raises(IntegrityError) as exc:
            role_builder.named("Unique").build()
        msg = str(exc.value).lower()
        assert "unique constraint" in msg or "already exists" in msg


class TestRoleUpdate:
    def test_update_keys(self, role_builder):
        role = role_builder.with_keys("old:key").build()
        role.permission_keys = ["new:key", "another:key"]
        role.save()
        role.refresh_from_db()
        assert role.permission_keys == ["new:key", "another:key"]


class TestRoleDelete:
    def test_cascade_to_user_assignment(self, role_builder, user, assignment_builder):
        role = role_builder.with_keys("x:y").build()
        assignment = assignment_builder.with_roles(role).build()
        role.delete()
        assignment.refresh_from_db()
        assert assignment.roles.count() == 0


class TestRoleStr:
    def test_str(self, role_builder):
        role = role_builder.named("Str Role").build()
        assert str(role) == "Str Role"
