from rest_framework import serializers


class FieldPermissionMixin:
    """
    Mixin for Serializers to enforce field-level (column-wise) permissions.

    Convention: Permission keys follow the pattern:
        {prefix}:field:{field_name}:read   — can see this field
        {prefix}:field:{field_name}:write  — can edit this field

    If ANY field-level permissions exist for a model prefix, fields without
    explicit read permission are hidden, and fields without explicit write
    permission are set to read_only.

    If NO field-level permissions exist, all fields remain visible and writable
    (action-level permissions are sufficient).
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._apply_field_permissions()

    def _apply_field_permissions(self):
        """Apply field-level read/write restrictions based on user's RBAC manifest."""
        request = self.context.get("request")
        if not request or not hasattr(request, "user"):
            return

        user = request.user

        # Superusers see and edit everything
        if getattr(user, "is_superuser", False):
            return

        model = getattr(self.Meta, "model", None)
        if not model:
            return

        prefix = getattr(model, "permission_prefix", None)
        if not prefix:
            return

        # Get the user's permission manifest
        manifest = getattr(user, "permission_manifest", None)
        if manifest is None:
            return

        # Check if ANY field-level permissions exist for this model
        if not manifest.has_any_field_perms(prefix):
            return  # No field perms → all fields visible/writable

        for field_name, field in self.fields.items():
            # Check read permission
            if not manifest.has_field_read(prefix, field_name):
                field.hidden = True
                continue

            # Check write permission
            if not manifest.has_field_write(prefix, field_name):
                field.read_only = True
