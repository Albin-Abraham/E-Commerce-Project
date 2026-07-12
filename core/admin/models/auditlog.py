# core/admin/models/auditlog.py
from django.db import models
from django.conf import settings
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey

class AuditEntry(models.Model):
    """
    Generic Audit Log for tracking all changes to models.
    Stores diffs in JSON format for easy querying and reporting.
    """
    ACTION_CHOICES = [
        ('create', 'Create'),
        ('update', 'Update'),
        ('delete', 'Delete'),
    ]

    # Target Object (Generic)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.CharField(max_length=255)
    content_object = GenericForeignKey('content_type', 'object_id')

    # Metadata
    action = models.CharField(max_length=10, choices=ACTION_CHOICES)
    changes = models.JSONField(default=dict, help_text="JSON payload of changed fields and their old/new values.")
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name="audit_logs"
    )
    
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "audit_entries"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["content_type", "object_id"]),
            models.Index(fields=["action"]),
        ]


    def __str__(self):
        return f"{self.action.upper()} on {self.content_type} ({self.object_id})"


class SystemLogEntry(models.Model):
    """
    Industrialized System Log.
    Used for high-fidelity debugging and technical audit trails.
    """
    LEVEL_CHOICES = [
        ('INFO', 'Info'),
        ('WARNING', 'Warning'),
        ('ERROR', 'Error'),
        ('CRITICAL', 'Critical'),
    ]

    level = models.CharField(max_length=10, choices=LEVEL_CHOICES, default='INFO')
    module = models.CharField(max_length=100, db_index=True)
    message = models.TextField()
    payload = models.JSONField(default=dict, blank=True)
    
    # Traceability
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True
    )
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    request_id = models.CharField(max_length=100, null=True, blank=True, db_index=True)
    
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "system_logs"
        ordering = ["-created_at"]

    def __str__(self):
        return f"[{self.level}] {self.module}: {self.message[:50]}"
