# core/base_models/system_models.py
from django.db import models
from core.base_models.validator_model import BaseModel
from core.base_models.fields.char_fields import CustomCharField
from core.base_models.fields.boolean_fields import CustomBooleanField
from core.base_models.validators.rules import RequiredRule, MinRule, UniqueRule
from core.base_models.fields.json_fields import CustomJSONField




class SystemConfig(BaseModel):
    key = CustomCharField(
        max_length=100, 
        unique=True, 
        rules=[RequiredRule("key"), UniqueRule("key")],
        verbose_name="Configuration Key"
    )
    value = CustomCharField(
        max_length=255, 
        rules=[RequiredRule("value")],
        null=True,
        blank=True,
        verbose_name="Configuration Value"
    )
    description = models.TextField(blank=True, null=True)
    details = CustomJSONField(default=dict, blank=True, verbose_name="Configuration Details")
    
    # Renamed for clarity: parent_group instead of is_group
    parent_group = models.ForeignKey(
        "self", 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True, 
        related_name="children",
        verbose_name="Parent Group"
    )

    class Meta:
        db_table = "system_configs"
        verbose_name = "System Config"
        verbose_name_plural = "System Configs"

    @property
    def is_group(self):
        """Returns True if this config entry serves as a container."""
        return self.value is None or self.value == ""

    @classmethod
    def load_val(cls, key, default=None):
        """Safe utility to fetch values by key across the app."""
        config = cls.objects.filter(key=key).first()
        return config.value if config else default

    def __str__(self):
        return f"{self.key}: {self.value}" if self.value else f"[Group] {self.key}"


class SystemModule(BaseModel):
    """
    Represents a top-level system module (e.g., HR, Finance, Administration).
    """
    code = CustomCharField(max_length=50, unique=True, verbose_name="Module Code")
    name = CustomCharField(max_length=100, verbose_name="Module Name")
    is_active = CustomBooleanField(default=True)
    icon = CustomCharField(max_length=50, blank=True, null=True, verbose_name="Icon Name")
    color = CustomCharField(max_length=20, blank=True, null=True, verbose_name="Display Color")
    description = models.TextField(blank=True, null=True)

    class Meta:
        db_table = "system_modules"
        verbose_name = "System Module"
        verbose_name_plural = "System Modules"

    def __str__(self):
        return f"{self.name} ({self.code})"


class SystemFeature(BaseModel):
    """
    Represents a granular feature within a module.
    """
    module = models.ForeignKey(
        SystemModule, 
        on_delete=models.CASCADE, 
        related_name="features"
    )
    code = CustomCharField(max_length=100, unique=True, verbose_name="Feature Code")
    name = CustomCharField(max_length=150, verbose_name="Feature Name")
    model_name = CustomCharField(max_length=100, blank=True, null=True, verbose_name="Primary Model")
    related_models = CustomJSONField(default=list, blank=True, verbose_name="Related Models")
    is_enabled = CustomBooleanField(default=True)
    description = models.TextField(blank=True, null=True)
    special_permissions = CustomJSONField(default=list, blank=True, verbose_name="Special Permissions")

    class Meta:
        db_table = "system_features"
        verbose_name = "System Feature"
        verbose_name_plural = "System Features"

    def __str__(self):
        return f"{self.code} (Module: {self.module.code})"


class FeatureDependency(BaseModel):
    """
    Defines relationships between features.
    """
    feature = models.ForeignKey(
        SystemFeature, 
        on_delete=models.CASCADE, 
        related_name="feature_dependencies"
    )
    depends_on = models.ForeignKey(
        SystemFeature, 
        on_delete=models.CASCADE, 
        related_name="dependent_features"
    )

    class Meta:
        db_table = "feature_dependencies"
        unique_together = ("feature", "depends_on")
        verbose_name = "Feature Dependency"
        verbose_name_plural = "Feature Dependencies"

    def __str__(self):
        return f"{self.feature.code} -> {self.depends_on.code}"


class SystemHealth(BaseModel):
    """
    Tracks the real-time health and connectivity of system dependencies 
    (Redis, Celery, Database, etc.)
    """
    STATUS_CHOICES = [
        ("healthy", "Healthy"),
        ("degraded", "Degraded"),
        ("critical", "Critical"),
        ("unknown", "Unknown"),
    ]

    component_name = CustomCharField(max_length=100, unique=True, verbose_name="Component Name")
    status = CustomCharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default="unknown", 
        verbose_name="Health Status"
    )
    last_check = models.DateTimeField(auto_now=True)
    latency_ms = models.FloatField(null=True, blank=True, verbose_name="Latency (ms)")
    details = CustomJSONField(default=dict, blank=True, verbose_name="Health Details")

    class Meta:
        db_table = "system_health"
        verbose_name = "System Health"
        verbose_name_plural = "System Health Monitoring"

    def __str__(self):
        return f"{self.component_name}: {self.status.upper()}"
