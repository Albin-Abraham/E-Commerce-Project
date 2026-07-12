from django.db import models
from core.base_models.fields.mixins import RulesFieldMixin
from core.base_models.constants import (
    BOOLEAN_CHOICES,
)

class CustomBooleanField(RulesFieldMixin, models.BooleanField):
    """
    Wrapper for BooleanField with defaults and validation rules.
    """
    def __init__(self, *args, rules=None, conditions=None, default=False, **kwargs):
        kwargs["default"] = default
        super().__init__(*args, rules=rules, conditions=conditions, **kwargs)
