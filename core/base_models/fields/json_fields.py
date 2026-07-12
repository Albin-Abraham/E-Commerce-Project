# core/base_models/fields/json_fields.py
from django.db import models
from core.base_models.fields.mixins import RulesFieldMixin

class CustomJSONField(RulesFieldMixin, models.JSONField):
    """
    Wrapper for JSONField with validation rules support.
    """
    def __init__(self, *args, rules=None, conditions=None, **kwargs):
        super().__init__(*args, rules=rules, conditions=conditions, **kwargs)
