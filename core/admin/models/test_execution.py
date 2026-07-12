from django.db import models
from core.base_models.validator_model import BaseModel
from django.utils.translation import gettext_lazy as _

class TestRun(BaseModel):
    """
    Model to track test suite executions.
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('running', 'Running'),
        ('passed', 'Passed'),
        ('failed', 'Failed'),
        ('error', 'Error'),
    ]

    module = models.CharField(max_length=255, default='all')
    category = models.CharField(max_length=100, default='all') # unit, system, feature, regression
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    logs = models.TextField(blank=True, null=True)
    summary = models.JSONField(blank=True, null=True) # e.g. {"passed": 10, "failed": 2, "total": 12}
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ['-started_at']

    def __str__(self):
        return f"Run {self.id} - {self.module}:{self.category} - {self.status}"
