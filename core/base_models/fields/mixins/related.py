# core/base_models/fields/mixins/related.py
from django.db import models
from core.base_models.fields.mixins.field_rules import RulesFieldMixin

class RulesForeignKey(RulesFieldMixin, models.ForeignKey):
    """
    Wrapper for ForeignKey with validation rules support.
    """
    def __init__(self, to, on_delete, rules=None, conditions=None, **kwargs):
        super().__init__(to, on_delete=on_delete, rules=rules, conditions=conditions, **kwargs)

class RulesOneToOneField(RulesFieldMixin, models.OneToOneField):
    """
    Wrapper for OneToOneField with validation rules support.
    """
    def __init__(self, to, on_delete, rules=None, conditions=None, **kwargs):
        super().__init__(to, on_delete=on_delete, rules=rules, conditions=conditions, **kwargs)
