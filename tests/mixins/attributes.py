# tests/mixins/attributes.py

class AttributeMixin:
    """Mixin for JSON / EAV attribute helpers."""

    def set_attr(self, instance, field, key, value, save=True):
        """Set a key/value pair in a JSON field."""
        data = getattr(instance, field) or {}
        data[key] = value
        setattr(instance, field, data)
        if save:
            instance.save()

    def get_attr(self, instance, field, key, default=None):
        """Get a value from a JSON field."""
        return getattr(instance, field, {}).get(key, default)
