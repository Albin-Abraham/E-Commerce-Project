from django.db import models


class TaskStatus:
    PENDING = "pending"
    PROCESSING = "processing"
    SUCCESS = "success"
    FAILURE = "failed"
    RETRYING = "retrying"

    CHOICES = [
        (PENDING, "Pending"),
        (PROCESSING, "Processing"),
        (SUCCESS, "Success"),
        (FAILURE, "Failed"),
        (RETRYING, "Retrying"),
    ]


class BackgroundTaskMixin(models.Model):
    """
    Standard mixin for models that track background tasks.
    """
    task_id = models.CharField(
        max_length=255, 
        null=True, 
        blank=True, 
        help_text="Celery Task UUID"
    )
    task_status = models.CharField(
        max_length=20, 
        choices=TaskStatus.CHOICES, 
        default=TaskStatus.PENDING
    )
    task_progress = models.IntegerField(
        default=0, 
        help_text="Progress percentage (0-100)"
    )
    task_result = models.JSONField(
        null=True, 
        blank=True, 
        help_text="Task output or success data"
    )
    task_error = models.JSONField(
        null=True, 
        blank=True, 
        help_text="Detailed exception/error details"
    )

    class Meta:
        abstract = True
