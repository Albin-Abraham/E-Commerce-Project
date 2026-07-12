# core/admin/services/audit_service.py
from django.contrib.contenttypes.models import ContentType
from core.admin.models.auditlog import AuditEntry
from .base_service import BaseService
from typing import Any, List, Dict

class AuditService(BaseService[AuditEntry]):
    """
    Service to manage and query Audit Log entries.
    Provides structured access to historical changes for any model.
    """
    model = AuditEntry

    @classmethod
    def get_logs_for_instance(cls, instance: Any) -> List[AuditEntry]:
        """
        Retrieves all audit logs associated with a specific model instance.
        """
        content_type = ContentType.objects.get_for_model(instance)
        return cls.model.objects.filter(
            content_type=content_type,
            object_id=str(instance.pk)
        ).order_by("-created_at")

    @classmethod
    def get_logs_for_model(cls, model_class: type) -> List[AuditEntry]:
        """
        Retrieves all audit logs for a specific model type.
        """
        content_type = ContentType.objects.get_for_model(model_class)
        return cls.model.objects.filter(content_type=content_type).order_by("-created_at")

    @classmethod
    def get_user_activity(cls, user_id: Any) -> List[AuditEntry]:
        """
        Retrieves all actions performed by a specific user.
        """
        return cls.model.objects.filter(user_id=user_id).order_by("-created_at")

    @classmethod
    def summarize_changes(cls, instance: Any) -> Dict[str, Any]:
        """
        Generates a summary of the most recent changes for an instance.
        """
        logs = cls.get_logs_for_instance(instance)[:5]
        return {
            "instance": str(instance),
            "log_count": logs.count(),
            "recent_actions": [
                {
                    "action": log.action,
                    "date": log.created_at.isoformat(),
                    "user": str(log.user) if log.user else "System",
                    "fields_changed": list(log.changes.keys())
                }
                for log in logs
            ]
        }
