import pytest

from django.core.cache import cache

from apps.users.utils.rbac_manifest import ManifestOrchestrator
from tests.permissions.constants import ROLE_SETS, DIRECT_PERM_SETS


class TestManifestPipeline:
    def test_full_pipeline(self, user, role_builder, group_builder, assignment_builder):
        role = role_builder.with_keys(*ROLE_SETS["finance"]).build()
        group = group_builder.with_keys(*ROLE_SETS["viewer"]).with_roles(role).build()
        assignment_builder.with_groups(group).with_direct(*DIRECT_PERM_SETS["expense"]).build()

        manifest = ManifestOrchestrator.build_for_user(user.id)
        for key in ROLE_SETS["finance"]:
            assert key in manifest.effective_permissions
        for key in ROLE_SETS["viewer"]:
            assert key in manifest.effective_permissions
        for key in DIRECT_PERM_SETS["expense"]:
            assert key in manifest.effective_permissions

        assert manifest.has_perm(list(ROLE_SETS["finance"])[0]) is True
        assert manifest.has_perm("nonexistent:key") is False

    def test_user_without_assignment_returns_empty(self, unassigned_user):
        manifest = ManifestOrchestrator.build_for_user(unassigned_user.id)
        assert manifest.effective_permissions == frozenset()
        assert manifest.has_perm("anything") is False


class TestManifestImmutability:
    def test_effective_permissions_is_frozenset(self, user_with_role):
        manifest = ManifestOrchestrator.build_for_user(user_with_role.id)
        assert isinstance(manifest.effective_permissions, frozenset)

    def test_cannot_mutate_effective_permissions(self, user_with_role):
        manifest = ManifestOrchestrator.build_for_user(user_with_role.id)
        with pytest.raises(AttributeError):
            manifest.effective_permissions.add("injected:key")

    def test_cannot_reassign_dataclass_attrs(self, user_with_role):
        manifest = ManifestOrchestrator.build_for_user(user_with_role.id)
        with pytest.raises(Exception):
            manifest.user_id = "hacked"


class TestManifestDeduplication:
    def test_duplicate_keys_across_role_and_direct(self, user, role_builder, assignment_builder):
        role = role_builder.with_keys("shared:key").build()
        assignment_builder.with_roles(role).with_direct("shared:key").build()
        manifest = ManifestOrchestrator.build_for_user(user.id)
        assert len(manifest.effective_permissions) == 1

    def test_duplicate_keys_in_role_list(self, user, role_builder, assignment_builder):
        role = role_builder.with_keys("dup:key", "dup:key", "unique:key").build()
        assignment_builder.with_roles(role).build()
        manifest = ManifestOrchestrator.build_for_user(user.id)
        assert len(manifest.effective_permissions) == 2


class TestManifestPrePostCondition:
    def test_updating_role_keys_updates_manifest(
        self, user, role_builder, assignment_builder,
    ):
        role = role_builder.with_keys("perm:old").build()
        assignment_builder.with_roles(role).build()

        manifest_before = ManifestOrchestrator.build_for_user(user.id, force_rebuild=True)
        assert "perm:old" in manifest_before.effective_permissions

        role.permission_keys = ["perm:new"]
        role.save()

        manifest_after = ManifestOrchestrator.build_for_user(user.id, force_rebuild=True)
        assert "perm:new" in manifest_after.effective_permissions
        assert "perm:old" not in manifest_after.effective_permissions

    def test_removing_role_from_assignment_removes_keys(
        self, user, role_builder, assignment_builder,
    ):
        role = role_builder.with_keys("removed:key").build()
        assignment = assignment_builder.with_roles(role).build()

        manifest_before = ManifestOrchestrator.build_for_user(user.id, force_rebuild=True)
        assert "removed:key" in manifest_before.effective_permissions

        assignment.roles.remove(role)

        manifest_after = ManifestOrchestrator.build_for_user(user.id, force_rebuild=True)
        assert "removed:key" not in manifest_after.effective_permissions


class TestManifestPerformance:
    def test_many_roles(self, user, role_builder, assignment_builder):
        assignment = assignment_builder.build()
        keys = set()
        for i in range(20):
            r = role_builder.named(f"R{i}").with_keys(f"perm:{i}").build()
            assignment.roles.add(r)
            keys.add(f"perm:{i}")

        manifest = ManifestOrchestrator.build_for_user(user.id)
        assert len(manifest.effective_permissions) == 20
        assert manifest.effective_permissions == frozenset(keys)


class TestManifestIsolation:
    def test_permissions_are_user_scoped(self, user, role_builder, assignment_builder, user_builder):
        other_user = user_builder.build()
        role = role_builder.with_keys("scoped:perm").build()
        assignment_builder.with_roles(role).build()

        user_manifest = ManifestOrchestrator.build_for_user(user.id, force_rebuild=True)
        other_manifest = ManifestOrchestrator.build_for_user(other_user.id, force_rebuild=True)

        assert user_manifest.has_perm("scoped:perm") is True
        assert other_manifest.has_perm("scoped:perm") is False

    def test_orphaned_role_does_not_crash_manifest(
        self, user, role_builder, group_builder, assignment_builder,
    ):
        role = role_builder.with_keys("orphaned:key").build()
        group = group_builder.with_keys().with_roles(role).build()
        assignment_builder.with_groups(group).build()

        role.delete()

        manifest = ManifestOrchestrator.build_for_user(user.id, force_rebuild=True)
        assert "orphaned:key" not in manifest.effective_permissions


class TestManifestCaching:
    def test_cache_hits_return_consistent(self, user_with_role):
        cache.clear()
        user = user_with_role
        m1 = ManifestOrchestrator.build_for_user(user.id)
        m2 = ManifestOrchestrator.build_for_user(user.id)
        assert m1 == m2

    def test_cache_key_includes_user_id(self, user_with_role):
        cache.clear()
        ManifestOrchestrator.build_for_user(user_with_role.id)
        key = f"rbac_manifest:{user_with_role.id}:global"
        cached = cache.get(key)
        assert cached is not None


class TestManifestMetadata:
    def test_metadata_for_yaml_keys(self, user, role_builder, assignment_builder):
        role = role_builder.with_keys("hrms:employee:profile").build()
        assignment_builder.with_roles(role).build()
        manifest = ManifestOrchestrator.build_for_user(user.id, force_rebuild=True)
        assert "hrms:employee:profile" in manifest.metadata
        meta = manifest.metadata["hrms:employee:profile"]
        assert meta["system_name"] == "Human Resource Management"
        assert meta["feature"] == "profile"

    def test_no_metadata_for_custom_keys(self, user, role_builder, assignment_builder):
        role = role_builder.with_keys("company:import").build()
        assignment_builder.with_roles(role).build()
        manifest = ManifestOrchestrator.build_for_user(user.id, force_rebuild=True)
        if "company:import" in manifest.metadata:
            assert manifest.metadata["company:import"] == {}
