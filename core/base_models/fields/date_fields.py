from django.db import models
from core.base_models.fields.mixins import RulesFieldMixin
from core.base_models.constants import NOW

class CustomDateTimeField(RulesFieldMixin, models.DateTimeField):
    """
    Wrapper for DateTimeField with defaults and validation rules.
    """
    def __init__(self, *args, rules=None, conditions=None, auto_now=False, auto_now_add=False, default_now=False, nullable=False, **kwargs):
        if nullable:
            kwargs.setdefault("null", True)
            kwargs.setdefault("blank", True)
        else:
            kwargs.setdefault("null", False)
            kwargs.setdefault("blank", False)

        if default_now and not (auto_now or auto_now_add):
            kwargs.setdefault("default", NOW)
            
        kwargs["auto_now"] = auto_now
        kwargs["auto_now_add"] = auto_now_add
        
        super().__init__(*args, **kwargs)


class CustomDateField(RulesFieldMixin, models.DateField):
    """
    Wrapper for DateField with defaults and validation rules.
    """
    def __init__(self, *args, rules=None, conditions=None, auto_now=False, auto_now_add=False, nullable=False, **kwargs):
        if nullable:
            kwargs.setdefault("null", True)
            kwargs.setdefault("blank", True)
        else:
            kwargs.setdefault("null", False)
            kwargs.setdefault("blank", False)

        kwargs["auto_now"] = auto_now
        kwargs["auto_now_add"] = auto_now_add
        
        super().__init__(*args, **kwargs)
