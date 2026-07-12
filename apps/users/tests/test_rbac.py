import pytest
from django.test import TestCase, override_settings
from django.contrib.auth import get_user_model
from apps.users.models.permissions import RolePermissions, RoleGroupPermissions, UserPermissionModel
from apps.users.models.catalog import BranchCatalog
from core.admin.models import Branch, Company
from apps.users.utils.rbac_manifest import ManifestOrchestrator
from django.core.cache import cache

User = get_user_model()

@pytest.mark.system
@override_settings(BYPASS_VALIDATION_GUARD=True)
class TestRBACManifest(TestCase):
    def setUp(self):
        cache.clear()
        # 1. Create a Test User
        self.user = User.objects.create_user(
            username="rbac_user", 
            email="rbac@example.com", 
            password="password"
        )
        
        # 2. Create Roles
        self.role_view = RolePermissions.objects.create(
            name="Viewer",
            permission_keys=["admin:security:can_view_audit_logs", "hrms:employee:profile"]
        )
        self.role_edit = RolePermissions.objects.create(
            name="Editor",
            permission_keys=["admin:identity:can_manage_users"]
        )

        # 3. Create Group
        self.group = RoleGroupPermissions.objects.create(
            name="Admin Group",
            permission_keys=["admin:identity:can_configure_roles"]
        )
        self.group.roles.add(self.role_view, self.role_edit)

        # 4. Create User Assignment
        self.assignment = UserPermissionModel.objects.create(
            user=self.user,
            direct_permissions=["hrms:leave:can_request_leave"]
        )
        self.assignment.groups.add(self.group)

    def test_manifest_aggregation(self):
        """
        Verify that ManifestOrchestrator correctly flattens Roles, Groups, and Direct perms.
        """
        manifest = ManifestOrchestrator.build_for_user(self.user.id)

        # Check Effective Permissions (Flat)
        expected_perms = {
            "admin:security:can_view_audit_logs",
            "hrms:employee:profile",
            "admin:identity:can_manage_users",
            "admin:identity:can_configure_roles",
            "hrms:leave:can_request_leave",
        }
        self.assertEqual(manifest.effective_permissions, frozenset(expected_perms))

        # Check Roles (Aggregated)
        self.assertIn("Viewer", manifest.roles)
        self.assertIn("Editor", manifest.roles)

        # Check Groups
        self.assertIn("Admin Group", manifest.groups)

    def test_user_cached_property(self):
        """
        Verify that UserModel.permission_manifest is accessible and works.
        """
        # Reload user to ensure cached_property is fresh
        user = User.objects.get(id=self.user.id)

        self.assertTrue(user.permission_manifest.has_perm("admin:security:can_view_audit_logs"))
        self.assertTrue(user.permission_manifest.has_perm("admin:identity:can_configure_roles"))
        self.assertFalse(user.permission_manifest.has_perm("admin:security:can_whitelist_ips"))

    def test_evaluate_policy_integration(self):
        """
        Verify that evaluate_policy (via auth_utils) uses the manifest.
        """
        from core.admin.utils.auth_utils import evaluate_policy

        # Test authorized
        self.assertTrue(evaluate_policy(self.user, "admin:security:can_view_audit_logs"))
        self.assertTrue(evaluate_policy(self.user, "admin:identity:can_configure_roles"))

        # Test unauthorized
        self.assertFalse(evaluate_policy(self.user, "admin:security:can_whitelist_ips"))

    def test_saas_catalog_filtering(self):
        """Verify that BranchCatalog restricts user permissions."""
        # 1. Create a Catalog that ONLY allows 'hrms:employee:profile'
        catalog = BranchCatalog.objects.create(
            name="HRMS Lite",
            module_keys=["hrms"],
            allowed_permission_keys=["hrms:employee:profile"]
        )
        
        # 2. Create Branch linked to this Catalog
        company = Company.objects.create(name="SaaS Corp")
        from core.admin.models.business_unit import BusinessUnit
        bu = BusinessUnit.objects.create(name="Default BU", company=company)
        branch = Branch.objects.create(
            name="SaaS Branch",
            code="SAAS-1",
            company=company,
            business_unit=bu,
            location="HQ",
            catalog=catalog,
            opened_date="2024-01-01"
        )
        
        # 3. Create a Role with broad permissions
        role = RolePermissions.objects.create(
            name="Super HR",
            permission_keys=["hrms:employee:profile", "finance:accounts:ledger"]
        )
        
        # 4. Assign to User
        UserPermissionModel.objects.filter(user=self.user).delete()
        assignment = UserPermissionModel.objects.create(user=self.user)
        assignment.roles.add(role)
        
        # 5. Build manifest WITH branch_id
        manifest = ManifestOrchestrator.build_for_user(self.user.id, branch_id=branch.id)
        
        # 6. Verify intersection: 'hrms:employee:profile' is allowed, 'finance:accounts:ledger' is filtered out
        self.assertIn("hrms:employee:profile", manifest.effective_permissions)
        self.assertNotIn("finance:accounts:ledger", manifest.effective_permissions)

    from django.test import override_settings
    @override_settings(CACHES={'default': {'BACKEND': 'django.core.cache.backends.locmem.LocMemCache'}})
    def test_manifest_caching(self):
        """Verify that the manifest is cached."""
        cache.clear()
        ManifestOrchestrator.build_for_user(self.user.id)
        cache_key = f"rbac_manifest:{self.user.id}:global"
        self.assertTrue(cache.has_key(cache_key))

    def test_manifest_metadata_enrichment(self):
        """Verify that manifest includes metadata from modules.yaml."""
        role = RolePermissions.objects.create(
            name="HR Viewer",
            permission_keys=["hrms:employee:profile"]
        )
        UserPermissionModel.objects.filter(user=self.user).delete()
        assignment = UserPermissionModel.objects.create(user=self.user)
        assignment.roles.add(role)

        manifest = ManifestOrchestrator.build_for_user(self.user.id, force_rebuild=True)

        key = "hrms:employee:profile"
        self.assertIn(key, manifest.metadata)
        self.assertEqual(manifest.metadata[key]["system_name"], "Human Resource Management")
        self.assertEqual(manifest.metadata[key]["module_name"], "Employee Management")
        self.assertEqual(manifest.metadata[key]["feature"], "profile")
