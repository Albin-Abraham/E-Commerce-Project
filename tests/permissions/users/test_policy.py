import pytest

from core.admin.utils.auth_utils import check_permission, evaluate_policy
from core.base_models.permissions import PermissionPolicyMixin
from core.admin.permissions.drf_permissions import CustomPermissionClass
from core.admin.models import Company
from rest_framework.test import APIRequestFactory
from rest_framework.views import APIView

from tests.permissions.constants import COMPANY_PERMISSION_ACTIONS


class TestCheckPermission:
    def test_uses_manifest(self, user, role_builder, assignment_builder):
        role = role_builder.with_keys("admin:security:audit_logs").build()
        assignment_builder.with_roles(role).build()
        assert check_permission(user, "admin:security:audit_logs") is True
        assert check_permission(user, "admin:security:ip_whitelisting") is False

    def test_unauthenticated_denied(self):
        assert check_permission(None, "anything") is False


class TestEvaluatePolicy:
    def test_single_perm(self, user, role_builder, assignment_builder):
        role = role_builder.with_keys("perm:a").build()
        assignment_builder.with_roles(role).build()
        assert evaluate_policy(user, "perm:a") is True
        assert evaluate_policy(user, "perm:z") is False

    def test_all_operator(self, user, role_builder, assignment_builder):
        role = role_builder.with_keys("perm:a", "perm:b", "perm:c").build()
        assignment_builder.with_roles(role).build()
        assert evaluate_policy(user, {"all": ["perm:a", "perm:b"]}) is True
        assert evaluate_policy(user, {"all": ["perm:a", "perm:z"]}) is False

    def test_any_operator(self, user, role_builder, assignment_builder):
        role = role_builder.with_keys("perm:a", "perm:b").build()
        assignment_builder.with_roles(role).build()
        assert evaluate_policy(user, {"any": ["perm:a", "perm:z"]}) is True
        assert evaluate_policy(user, {"any": ["perm:z", "perm:y"]}) is False

    def test_at_least_operator(self, user, role_builder, assignment_builder):
        role = role_builder.with_keys("perm:a", "perm:b", "perm:c").build()
        assignment_builder.with_roles(role).build()
        assert evaluate_policy(
            user, {"at_least": [2, ["perm:a", "perm:b", "perm:z"]]}
        ) is True
        assert evaluate_policy(
            user, {"at_least": [3, ["perm:a", "perm:z", "perm:y"]]}
        ) is False


class TestSuperuserBypass:
    @pytest.mark.xfail(reason="Pre-existing: post_save signal needs SYSTEM_BRANCH_CODE migration fix")
    def test_superuser_bypasses_all(self, user_builder):
        user = user_builder.as_superuser().build()
        assert evaluate_policy(user, "any:nonexistent:key") is True


class TestPermissionPolicyMixin:
    @pytest.mark.parametrize("action,expected", list(COMPANY_PERMISSION_ACTIONS.items()))
    def test_get_required_known_actions(self, action, expected):
        result = Company.get_required_permission_for_action(action)
        assert result == expected

    def test_get_required_unknown_returns_none(self):
        result = Company.get_required_permission_for_action("nonexistent")
        assert result is None

    def test_get_declared_permissions(self):
        perms = Company.get_declared_permissions()
        keys = {p[0] for p in perms}
        for key in COMPANY_PERMISSION_ACTIONS.values():
            assert key in keys

    def test_drf_fallback_returns_false(self):
        factory = APIRequestFactory()
        request = factory.get("/")

        class BareView(APIView):
            pass

        perm = CustomPermissionClass()
        assert perm.has_permission(request, BareView()) is False

    def test_model_without_permission_map_returns_none(self):
        class BareModel(PermissionPolicyMixin):
            pass

        result = BareModel.get_required_permission_for_action("create")
        assert result is None

    def test_model_without_permission_prefix_uses_class_name(self):
        class AutoPrefixModel(PermissionPolicyMixin):
            permission_map = {"view": "can_view"}

        result = AutoPrefixModel.get_required_permission_for_action("view")
        assert result == "autoprefixmodel:can_view"
