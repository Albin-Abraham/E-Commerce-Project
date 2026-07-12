import pytest


class TestSaaSCatalogFiltering:
    @pytest.mark.xfail(reason="Pre-existing migration: company_branches missing business_unit_id column")
    def test_catalog_restricts_manifest(
        self, user, catalog_builder, role_builder, assignment_builder, company,
    ):
        from apps.users.utils.rbac_manifest import ManifestOrchestrator
        from core.admin.models import Branch

        catalog = catalog_builder.named("HRMS Lite").with_modules("hrms").with_keys(
            "hrms:employee:profile"
        ).build()

        branch = Branch.objects.create(
            name="Filtered Branch", code="FB01",
            company=company, catalog=catalog, opened_date="2024-01-01",
        )

        role = role_builder.with_keys(
            "hrms:employee:profile", "finance:accounts:ledger"
        ).build()
        assignment_builder.with_roles(role).build()

        global_manifest = ManifestOrchestrator.build_for_user(user.id)
        assert "finance:accounts:ledger" in global_manifest.effective_permissions

        scoped = ManifestOrchestrator.build_for_user(user.id, branch_id=branch.id)
        assert "hrms:employee:profile" in scoped.effective_permissions
        assert "finance:accounts:ledger" not in scoped.effective_permissions
