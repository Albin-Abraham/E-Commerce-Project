# backend/admin/models/subscriptions.py

from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError
from core.base_models.validator_model import BaseModel
from core.base_models.validators.rules import RequiredRule, UniqueRule, PricingRule, ChoiceRule, ListRule, JSONKeyRule
from core.base_models.registry import ModuleRegistry
from core.base_models.fields import CustomCharField, CustomJSONField


# Subscription validation is now handled via PricingRule, RequiredRule, and UniqueRule.
# Ad-hoc validate_pricing function is removed.


# ---------------------------
# Subscription Model
# ---------------------------

class Subscription(BaseModel):
    """
    SaaS Subscription Plan Model.
    
    Stores module access, license limits, and pricing structures.
    Uses unified validation rules for name uniqueness and pricing schema.
    """

    name = CustomCharField(
        unique=True, 
        rules=[RequiredRule("name"), UniqueRule("name")]
    )
    description = models.TextField(blank=True)

    # JSON configuration
    licenses = CustomJSONField(
        default=dict, 
        blank=True,
        rules=[
            JSONKeyRule(
                "licenses", 
                required_keys=["max_users"], 
                types={"max_users": int, "max_business_units": int, "storage_gb": int}
            )
        ]
    )
    modules = CustomJSONField(
        default=list, 
        blank=True,
        rules=[
            ListRule("modules", item_type=str),
            ChoiceRule("modules", choices=ModuleRegistry.get_all_keys)
        ]
    )
    pricing = CustomJSONField(
        default=dict, 
        blank=True,
        rules=[
            JSONKeyRule(
                "pricing", 
                required_keys=["currency", "monthly"], 
                types={"monthly": (int, float), "currency": str}
            )
        ]
    )

    is_active = models.BooleanField(default=True)


    class Meta:
        db_table = "saas_subscriptions"
        ordering = ["name"]

    def __str__(self):
        return self.name

    # Helper methods
    def get_attribute(self, key, default=None):
        attr = self.attributes.filter(key=key).first()
        return attr.value if attr else default

    def set_attribute(self, key, value):
        attr, created = SubscriptionAttribute.objects.update_or_create(
            subscription=self,
            key=key,
            defaults={"value": value},
        )
        return attr

    def remove_attribute(self, key):
        self.attributes.filter(key=key).delete()


# ---------------------------
# EAV Model for dynamic subscription attributes
# ---------------------------

class SubscriptionAttribute(models.Model):
    """
    Dynamic attributes for subscription plans.
    Useful for custom settings, feature flags, limits, etc.
    """

    subscription = models.ForeignKey(
        Subscription,
        related_name="attributes",
        on_delete=models.CASCADE
    )

    key = models.CharField(max_length=255)
    value = models.JSONField(default=dict)

    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "saas_subscription_attributes"
        unique_together = ("subscription", "key")
        indexes = [
            models.Index(fields=["subscription", "key"]),
            models.Index(fields=["key"]),
        ]

    def __str__(self):
        return f"{self.subscription.name} → {self.key}"
