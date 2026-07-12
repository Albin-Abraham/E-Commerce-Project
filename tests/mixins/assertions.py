# tests/mixins/assertions.py

class AssertionMixin:
    """Mixin for reusable field and JSON assertions."""

    def assert_field(self, instance, field, expected):
        """Assert that a model instance field matches the expected value."""
        actual = getattr(instance, field)
        assert actual == expected, f"{instance.__class__.__name__}.{field} = {actual}, expected {expected}"

    def assert_json_attr(self, instance, field, key, expected):
        """Assert that a JSON field in a model instance contains the expected key/value."""
        value = getattr(instance, field, {})
        if value is None:
            value = {}
        actual = value.get(key)
        assert actual == expected, f"{instance.__class__.__name__}.{field}[{key}] = {actual}, expected {expected}"
