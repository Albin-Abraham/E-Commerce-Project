import pytest


import pytest
from django.db import IntegrityError

from apps.users.models.permissions import RolePermissions


PARAM_SETS = [
    pytest.param([], id="empty"),
    pytest.param(["single:key"], id="single"),
    pytest.param(["a:1", "b:2", "c:3", "d:4"], id="multiple"),
    pytest.param(["dup:x", "dup:x", "unique:y"], id="duplicates"),
]


class TestRoleKeySets:
    @pytest.mark.parametrize("keys", PARAM_SETS)
    def test_stores_as_provided(self, role_builder, keys):
        role = role_builder.with_keys(*keys).build()
        assert role.permission_keys == keys

    def test_null_keys_violates_not_null_constraint(self):
        with pytest.raises(IntegrityError):
            RolePermissions.objects.create(name="null_test", permission_keys=None)
