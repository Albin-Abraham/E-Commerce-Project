from django.db import models
from core.base_models.fields.mixins import RulesFieldMixin
from core.base_models.constants import (
    DEFAULT_CHAR_LENGTH,
    DEFAULT_TEXT_LENGTH,
    EMAIL_MAX_LENGTH,
    EMAIL_REGEX_VALIDATOR,
    validate_email_domain
)

class CustomCharField(RulesFieldMixin, models.CharField):
    """
    Wrapper for CharField with project defaults and validation rules.
    """
    def __init__(self, *args, rules=None, conditions=None, nullable=False, **kwargs):
        kwargs.setdefault("max_length", DEFAULT_CHAR_LENGTH)
        
        if nullable:
            kwargs.setdefault("null", True)
            kwargs.setdefault("blank", True)
        else:
            kwargs.setdefault("null", False)
            kwargs.setdefault("blank", False)
            
        super().__init__(*args, rules=rules, conditions=conditions, **kwargs)


class CustomTextField(RulesFieldMixin, models.TextField):
    """
    Wrapper for TextField with project defaults and validation rules.
    """
    def __init__(self, *args, rules=None, conditions=None, nullable=False, **kwargs):
        if nullable:
            kwargs.setdefault("null", True)
            kwargs.setdefault("blank", True)
        else:
            kwargs.setdefault("null", False)
            kwargs.setdefault("blank", True)
            
        super().__init__(*args, rules=rules, conditions=conditions, **kwargs)


class CustomEmailField(RulesFieldMixin, models.EmailField):
    """
    Wrapper for EmailField with strict validation and project-specific rules.
    """
    def __init__(self, *args, rules=None, conditions=None, nullable=False, **kwargs):
        kwargs.setdefault("max_length", EMAIL_MAX_LENGTH)
        
        validators = kwargs.get("validators", [])
        if not validators:
            validators = [EMAIL_REGEX_VALIDATOR, validate_email_domain]
        else:
            if EMAIL_REGEX_VALIDATOR not in validators:
                validators.append(EMAIL_REGEX_VALIDATOR)
            if validate_email_domain not in validators:
                validators.append(validate_email_domain)
        kwargs["validators"] = validators

        if nullable:
            kwargs.setdefault("null", True)
            kwargs.setdefault("blank", True)
        else:
            kwargs.setdefault("null", False)
            kwargs.setdefault("blank", False)
            
        super().__init__(*args, rules=rules, conditions=conditions, **kwargs)
