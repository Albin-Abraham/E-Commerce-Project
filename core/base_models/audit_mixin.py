# core/base_models/audit_mixin.py
import json
import logging

from django.forms.models import model_to_dict
from django.contrib.contenttypes.models import ContentType

logger = logging.getLogger(__name__)


class AuditMixin:
    """
    Mixin for models that need to track changes (Audit Logging).
    Captures field-level diffs on save and creates an AuditEntry.
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._initial_state = self._capture_state()

    @classmethod
    def from_db(cls, db, field_names, values):
        instance = super().from_db(db, field_names, values)
        instance._initial_state = instance._capture_state()
        return instance

    def _capture_state(self):
        """Captures the current state of the model fields."""
        if not self.pk:
            return {}
        data = model_to_dict(self)
        return {
            k: (str(v) if not isinstance(v, (str, int, float, bool, type(None))) else v)
            for k, v in data.items()
        }

    def get_diff(self):
        """Returns a dictionary of changed fields with old and new values."""
        current_state = self._capture_state()
        diff = {}

        for field, value in current_state.items():
            old_value = self._initial_state.get(field)
            if old_value != value:
                diff[field] = {
                    "old": str(old_value) if old_value is not None else None,
                    "new": str(value) if value is not None else None,
                }
        return diff

    def create_audit_log(self, action, user=None, reason=None):
        """
        Industrialized Audit Insertion.
        Automatically pulls User and IP from RequestContext if not provided.
        """
        from core.admin.models.auditlog import AuditEntry
        from core.admin.utils.context import RequestContext

        user = user or RequestContext.get_user()
        ip = RequestContext.get_ip()

        diff = self.get_diff() if action == "update" else self._capture_state()
        if not diff and action == "update":
            return

        if reason:
            diff["_audit_metadata"] = {"reason": reason}

        try:
            AuditEntry.objects.create(
                content_type=ContentType.objects.get_for_model(self),
                object_id=str(self.pk),
                action=action,
                changes=diff,
                user=user,
                ip_address=ip,
            )
        except Exception as e:
            logger.error(f"Failed to create audit log for {self}: {e}")


__all__ = [
    "AuditMixin",
]
