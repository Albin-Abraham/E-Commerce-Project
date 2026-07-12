import pytest

from apps.users.utils.rbac_manifest import ManifestOrchestrator


class TestGroupRoleAggregation:
    def test_group_role_keys_appear_in_manifest(self, hr_group, user, assignment_builder):
        assignment_builder.with_groups(hr_group).build()
        manifest = ManifestOrchestrator.build_for_user(user.id)
        assert "admin:security:audit_logs" in manifest.effective_permissions
        assert "hrms:employee:profile" in manifest.effective_permissions

    def test_group_without_roles_yields_only_direct_keys(
        self, empty_group, user, assignment_builder,
    ):
        assignment_builder.with_groups(empty_group).build()
        manifest = ManifestOrchestrator.build_for_user(user.id)
        assert manifest.effective_permissions == frozenset()

    def test_multiple_groups_union_keys(
        self, admin_group, hr_group, user, assignment_builder,
    ):
        assignment_builder.with_groups(admin_group, hr_group).build()
        manifest = ManifestOrchestrator.build_for_user(user.id)
        assert "admin:security:audit_logs" in manifest.effective_permissions
        assert "hrms:employee:profile" in manifest.effective_permissions
        assert "admin:identity:role_configuration" in manifest.effective_permissions

    @pytest.mark.parametrize("role_count", [1, 3, 5])
    def test_multiple_roles_in_group(
        self, group_builder, role_builder, user, assignment_builder, role_count,
    ):
        roles = [
            role_builder.named(f"R{i}").with_keys(f"perm:{i}").build()
            for i in range(role_count)
        ]
        group = group_builder.with_roles(*roles).build()
        assignment_builder.with_groups(group).build()
        manifest = ManifestOrchestrator.build_for_user(user.id)
        expected = {f"perm:{i}" for i in range(role_count)}
        assert manifest.effective_permissions == frozenset(expected)
