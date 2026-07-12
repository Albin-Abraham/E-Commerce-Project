# tests/mixins/validation.py
import pytest
from django.core.exceptions import ValidationError

class ValidationMixin:
    """Mixin for explicit model validation checks."""

    def assert_valid(self, instance):
        """Assert that the instance passes full_clean()."""
        try:
            instance.full_clean()
        except ValidationError as e:
            pytest.fail(f"Expected valid instance of {instance.__class__.__name__}, got ValidationError: {e}")

    def assert_invalid(self, instance, field=None):
        """Assert that the instance fails full_clean()."""
        with pytest.raises(ValidationError) as excinfo:
            instance.full_clean()
        
        if field:
            assert field in excinfo.value.message_dict, f"Expected validation error on field '{field}', but got errors on: {list(excinfo.value.message_dict.keys())}"
