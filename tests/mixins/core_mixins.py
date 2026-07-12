import pytest
from django.core.exceptions import ValidationError

class CreationMixin:
    factory_class = None

    def create(self, **overrides):
        assert self.factory_class, "factory_class must be defined"
        from core.admin.utils.context import ContextEngine
        
        company_id = overrides.get("company_id") or getattr(overrides.get("company"), "id", None)
        buid = overrides.get("business_unit_id") or getattr(overrides.get("business_unit"), "id", None)
        branch_id = overrides.get("branch_id") or getattr(overrides.get("branch"), "id", None)
        
        with ContextEngine.run_as_tenant(company_id=company_id, business_unit_id=buid, branch_id=branch_id):
            from core.base_models.validator_model import bypass_mediator_guard
            with bypass_mediator_guard():
                return self.factory_class.create(**overrides)

class ValidationMixin:
    def assert_valid(self, instance):
        try:
            instance.full_clean()
        except ValidationError as e:
            pytest.fail(f"Expected valid instance, got {e}")

    def assert_invalid(self, instance):
        with pytest.raises(ValidationError):
            instance.full_clean()

class AssertionMixin:
    def assert_field(self, instance, field, expected):
        actual = getattr(instance, field)
        assert actual == expected, f"{field}={actual}, expected={expected}"

    def assert_json_attr(self, instance, field, key, expected):
        value = getattr(instance, field, {})
        assert value.get(key) == expected
