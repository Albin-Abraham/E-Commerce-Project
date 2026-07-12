import pytest
from django.core.exceptions import ValidationError

from tests.permissions.constants import VALID_YAML_KEYS, INVALID_YAML_KEY, CUSTOM_KEYS


YAML_VALID_PARAMS = [
    pytest.param(["hrms:employee:profile"], id="single_valid_yaml"),
    pytest.param(
        ["hrms:employee:profile", "admin:security:audit_logs"],
        id="multiple_valid_yaml",
    ),
]

CUSTOM_KEY_PARAMS = [
    pytest.param(["company:import"], id="single_custom_verb"),
    pytest.param(["company:import", "prefix:can_verb"], id="multiple_custom_verb"),
]

INVALID_YAML_PARAMS = [
    pytest.param([INVALID_YAML_KEY], id="single_invalid_yaml"),
    pytest.param([INVALID_YAML_KEY, "another:bogus:x"], id="multiple_invalid_yaml"),
]


class TestCatalogCreate:
    def test_create_valid(self, catalog_builder):
        catalog = catalog_builder.with_modules("hrms").with_keys(
            "hrms:employee:profile", "hrms:leave:leave_request"
        ).build()
        assert catalog.name is not None
        assert "hrms:employee:profile" in catalog.allowed_permission_keys

    def test_empty_keys(self, catalog_builder):
        catalog = catalog_builder.build()
        assert catalog.allowed_permission_keys == []

    def test_str(self, catalog_builder):
        catalog = catalog_builder.named("Test Catalog").build()
        assert str(catalog) == "Test Catalog"


class TestCatalogKeyValidation:
    @pytest.mark.parametrize("keys", YAML_VALID_PARAMS + CUSTOM_KEY_PARAMS)
    def test_valid_keys_pass(self, catalog_builder, keys):
        catalog = catalog_builder.with_modules("hrms").with_keys(*keys).build_instance()
        try:
            catalog.full_clean()
        except ValidationError:
            pytest.fail(f"Keys {keys} should pass validation")

    @pytest.mark.parametrize("keys", INVALID_YAML_PARAMS)
    def test_invalid_keys_fail(self, catalog_builder, keys):
        catalog = catalog_builder.with_keys(*keys).build_instance()
        with pytest.raises(ValidationError) as exc:
            catalog.full_clean()
        assert "allowed_permission_keys" in exc.value.message_dict

    def test_mixed_valid_and_invalid(self, catalog_builder):
        catalog = catalog_builder.with_modules("hrms").with_keys(
            "hrms:employee:profile", "company:import", "bogus:module:feature",
        ).build_instance()
        with pytest.raises(ValidationError) as exc:
            catalog.full_clean()
        assert "bogus:module:feature" in str(exc.value)
        assert "company:import" not in str(exc.value)


class TestCatalogModuleDependency:
    def test_satisfied_dependency(self, catalog_builder):
        catalog = catalog_builder.with_modules("hrms", "operations").with_keys(
            "operations:inventory:stock_tracking"
        ).build_instance()
        try:
            catalog.full_clean()
        except ValidationError:
            pytest.fail("Satisfied dependencies should pass")

    def test_missing_dependency_fails(self, catalog_builder):
        catalog = catalog_builder.with_modules("operations").with_keys(
            "operations:inventory:stock_tracking"
        ).build_instance()
        with pytest.raises(ValidationError) as exc:
            catalog.full_clean()
        assert "module_keys" in exc.value.message_dict
        assert "hrms" in str(exc.value).lower()

    def test_valid_keys_with_empty_modules_passes(self, catalog_builder):
        catalog = catalog_builder.with_keys("hrms:employee:profile").build_instance()
        try:
            catalog.full_clean()
        except ValidationError:
            pytest.fail("Valid YAML keys with empty modules should pass validation")


class TestCatalogSave:
    def test_save_triggers_validation(self, catalog_builder):
        catalog = catalog_builder.with_keys("bad:key:value").build_instance()
        with pytest.raises(ValidationError):
            catalog.save()
