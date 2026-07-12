import pytest
from unittest.mock import patch


class TestTargetedCacheInvalidation:
    """post_save on RolePermissions/RoleGroupPermissions/BranchCatalog now
    uses targeted invalidation (rebuild_manifest_task.delay for affected
    users) instead of cache.clear() for all users."""

    def test_role_key_update_does_not_use_global_invalidation(self, db, role_builder, user_builder):
        from apps.users.models.permissions import UserPermissionModel

        role = role_builder.with_keys("company:view").build()
        user1 = user_builder.build()
        user_builder.username = "user2_unique"
        user_builder.email = "user2_unique@test.com"
        user2 = user_builder.build()
        upm1 = UserPermissionModel(user=user1)
        upm1._validated_by_mediator = True
        upm1.save()
        upm2 = UserPermissionModel(user=user2)
        upm2._validated_by_mediator = True
        upm2.save()
        user1.rbac_assignment.roles.add(role)

        with patch(
            "apps.users.tasks.rbac_tasks.rebuild_manifest_task.delay"
        ) as mock_rebuild:
            role.permission_keys = ["company:edit"]
            role._validated_by_mediator = True
            role.save()

            mock_rebuild.assert_called_once()
            args, _ = mock_rebuild.call_args
            assert args[0] == user1.id

    def test_unrelated_user_not_invalidated_by_role_change(self, db, role_builder, user_builder):
        from apps.users.models.permissions import UserPermissionModel

        role = role_builder.with_keys("company:view").build()
        user1 = user_builder.build()
        user_builder.username = "user2_unique_b"
        user_builder.email = "user2_unique_b@test.com"
        user2 = user_builder.build()
        upm1 = UserPermissionModel(user=user1)
        upm1._validated_by_mediator = True
        upm1.save()
        upm2 = UserPermissionModel(user=user2)
        upm2._validated_by_mediator = True
        upm2.save()
        user1.rbac_assignment.roles.add(role)

        with patch(
            "apps.users.tasks.rbac_tasks.rebuild_manifest_task.delay"
        ) as mock_rebuild:
            role.permission_keys = ["company:edit"]
            role._validated_by_mediator = True
            role.save()

            called_user_ids = {
                call_args[0][0]
                for call_args in mock_rebuild.call_args_list
            }
            assert user1.id in called_user_ids
            assert user2.id not in called_user_ids


class TestCatalogSubscriptionValidation:
    """Branch.clean() now validates that the catalog's module_keys are
    covered by the company's subscription."""

    def test_catalog_with_unsubscribed_modules_raises_validation_error(self, db):
        from django.core.exceptions import ValidationError
        from core.admin.models import Company
        from core.admin.models.subscriptions import Subscription
        from core.admin.models.business_unit import BusinessUnit
        from core.admin.models.branch import Branch
        from apps.users.models.catalog import BranchCatalog

        subscription = Subscription(
            name="HR Only",
            modules=["hrms"],
            pricing={"currency": "USD", "monthly": 100},
        )
        subscription._validated_by_mediator = True
        subscription.save()

        company = Company(name="TestOrg", code="TO", subscription=subscription)
        company._validated_by_mediator = True
        company.save()

        bu = BusinessUnit(name="Main BU", company=company)
        bu._validated_by_mediator = True
        bu.save()

        catalog = BranchCatalog(
            name="Full Suite",
            module_keys=["hrms", "operations"],
            allowed_permission_keys=[],
        )
        catalog._validated_by_mediator = True
        catalog.save()
        branch = Branch(
            name="Main Branch",
            code="MB",
            company=company,
            business_unit=bu,
            catalog=catalog,
            opened_date="2024-01-01",
            location="HQ"
        )
        with pytest.raises(ValidationError):
            branch.full_clean()

    def test_catalog_with_subscribed_modules_passes_validation(self, db):
        from core.admin.models import Company
        from core.admin.models.subscriptions import Subscription
        from core.admin.models.business_unit import BusinessUnit
        from core.admin.models.branch import Branch
        from apps.users.models.catalog import BranchCatalog

        subscription = Subscription(
            name="Full Suite",
            modules=["hrms", "finance"],
            pricing={"currency": "USD", "monthly": 500},
        )
        subscription._validated_by_mediator = True
        subscription.save()

        company = Company(name="FullOrg", code="FO", subscription=subscription)
        company._validated_by_mediator = True
        company.save()

        bu = BusinessUnit(name="Main BU", company=company)
        bu._validated_by_mediator = True
        bu.save()

        catalog = BranchCatalog(
            name="HR Only",
            module_keys=["hrms"],
            allowed_permission_keys=[],
        )
        catalog._validated_by_mediator = True
        catalog.save()
        branch = Branch(
            name="Compliant Branch",
            code="CB",
            company=company,
            business_unit=bu,
            catalog=catalog,
            opened_date="2024-01-01",
            location="HQ"
        )
        branch.full_clean()

    def test_branch_without_catalog_skips_subscription_check(self, db):
        from core.admin.models import Company
        from core.admin.models.subscriptions import Subscription
        from core.admin.models.business_unit import BusinessUnit
        from core.admin.models.branch import Branch

        subscription = Subscription(
            name="Minimal",
            modules=["hrms"],
            pricing={"currency": "USD", "monthly": 50},
        )
        subscription._validated_by_mediator = True
        subscription.save()

        company = Company(name="MinOrg", code="MO", subscription=subscription)
        company._validated_by_mediator = True
        company.save()

        bu = BusinessUnit(name="Main BU", company=company)
        bu._validated_by_mediator = True
        bu.save()
        branch = Branch(
            name="No Catalog Branch",
            code="NC",
            company=company,
            business_unit=bu,
            catalog=None,
            opened_date="2024-01-01",
            location="HQ"
        )
        branch.full_clean()


@pytest.mark.xfail(strict=False, reason="No post_save signal auto-creates UserPermissionModel yet")
class TestAutoCreatePermissionAssignment:
    """RED: UserPermissionModel should be auto-created when a UserModel is registered."""

    def test_user_creation_auto_creates_permission_assignment(self, db):
        from django.contrib.auth import get_user_model
        from apps.users.models.permissions import UserPermissionModel

        user = get_user_model().objects.create_user(
            email="red_auto@test.com",
            username="red_auto_test",
            password="password123",
        )
        assert UserPermissionModel.objects.filter(user=user).exists()

    def test_new_user_has_empty_permissions(self, db):
        from django.contrib.auth import get_user_model
        from apps.users.models.permissions import UserPermissionModel

        user = get_user_model().objects.create_user(
            email="red_empty@test.com",
            username="red_empty_test",
            password="password123",
        )
        upm = UserPermissionModel.objects.get(user=user)
        assert upm.roles.count() == 0
        assert upm.groups.count() == 0
        assert upm.direct_permissions == []
