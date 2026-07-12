from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from core.base_models.fields.mixins import RulesFieldMixin
from core.base_models.constants import (
    DEFAULT_DECIMAL_MAX_DIGITS,
    DEFAULT_DECIMAL_DECIMAL_PLACES,
)

class CustomIntegerField(RulesFieldMixin, models.IntegerField):
    """
    Wrapper for IntegerField with defaults and validation rules.
    """
    def __init__(self, *args, rules=None, conditions=None, nullable=False, default_zero=True, min_value=None, max_value=None, **kwargs):
        validators = kwargs.get("validators", [])
        
        if min_value is not None:
            validators.append(MinValueValidator(min_value))
        if max_value is not None:
            validators.append(MaxValueValidator(max_value))
            
        kwargs["validators"] = validators

        if nullable:
            kwargs.setdefault("null", True)
            kwargs.setdefault("blank", True)
        else:
            kwargs.setdefault("null", False)
            kwargs.setdefault("blank", False)
            if default_zero:
                kwargs.setdefault("default", 0)
        
        super().__init__(*args, rules=rules, conditions=conditions, **kwargs)


class CustomDecimalField(RulesFieldMixin, models.DecimalField):
    """
    Wrapper for DecimalField with defaults and validation rules.
    """
    def __init__(self, *args, rules=None, conditions=None, nullable=False, default_zero=True, **kwargs):
        kwargs.setdefault("max_digits", DEFAULT_DECIMAL_MAX_DIGITS)
        kwargs.setdefault("decimal_places", DEFAULT_DECIMAL_DECIMAL_PLACES)
        
        if nullable:
            kwargs.setdefault("null", True)
            kwargs.setdefault("blank", True)
        else:
            kwargs.setdefault("null", False)
            kwargs.setdefault("blank", False)
            if default_zero:
                kwargs.setdefault("default", 0.0)
                
        super().__init__(*args, rules=rules, conditions=conditions, **kwargs)
