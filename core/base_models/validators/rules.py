import re
from django.core.exceptions import ValidationError as DjangoValidationError
from django.contrib.auth.password_validation import validate_password
# core/validators/rules.py

class BaseRule:
    """
    Unified Base Class for validation rules.
    
    Supports context-aware validation, conditional application, 
    and multi-system compatibility (Django/DRF).
    """
    def __init__(self, error_message=None, error_code=None):
        self.error_message = error_message or "Validation failed."
        self.error_code = error_code or "invalid"

    def applies(self, instance, value, context=None) -> bool:
        """Determine if the rule should execute."""
        return True

    def validate(self, instance, value, context=None):
        """
        Execute validation. Raise RuleViolation if failed.
        """
        if not self.applies(instance, value, context):
            return

        trace = context.get("_trace", None) if isinstance(context, dict) else None
        
        if not self.check(instance):
            from core.base_models.exceptions import RuleViolation
            raise RuleViolation(
                message=self.error_message, 
                code=self.error_code,
                metadata={"rule_type": self.__class__.__name__}
            )

    def check(self, instance):
        """Legacy check method. Returns True if valid."""
        return True

    def when(self, condition_func):
        """
        Fluent API to make a rule conditional.
        Example: RequiredRule("email").when(lambda inst: inst.is_active)
        """
        return ConditionalWrapper(self, condition_func)


class ConditionalWrapper(BaseRule):
    """
    Wraps another rule and only executes it if a condition is met.
    """
    def __init__(self, rule, condition_func):
        self.rule = rule
        self.condition_func = condition_func
        super().__init__(rule.error_message, rule.error_code)
        if hasattr(rule, 'field_name'):
            self.field_name = rule.field_name

    def applies(self, instance, value, context=None) -> bool:
        if self.condition_func(instance):
            return self.rule.applies(instance, value, context)
        return False

    def validate(self, instance, value, context=None):
        if self.applies(instance, value, context):
            self.rule.validate(instance, value, context)


class ConditionRule(BaseRule):
    """
    Rule based on a callable condition (context-aware or cross-field).
    """
    def __init__(self, condition_func, error_message=None, error_code=None):
        super().__init__(error_message, error_code)
        self.condition_func = condition_func

    def check(self, instance):
        # condition_func should return True if VALID
        return self.condition_func(instance)


class FieldConstraintRule(BaseRule):
    """
    Rule for single field constraints.
    
    Standardizes the logic for extracting a field value and applying 
    a specialized constraint function.
    """
    def __init__(self, field_name, constraint_func, error_message=None, error_code=None):
        super().__init__(error_message, error_code)
        self.field_name = field_name
        self.constraint_func = constraint_func

    def check(self, instance):
        if not hasattr(instance, self.field_name):
            return True 
        
        value = getattr(instance, self.field_name)
        return self.constraint_func(value)


class GTRule(FieldConstraintRule):
    """Greater Than rule."""
    def __init__(self, field_name, threshold, error_message=None, error_code="gt"):
        message = error_message or f"{field_name} must be greater than {threshold}."
        super().__init__(field_name, lambda v: v > threshold if v is not None else True, message, error_code)


class LTRule(FieldConstraintRule):
    """Less Than rule."""
    def __init__(self, field_name, threshold, error_message=None, error_code="lt"):
        message = error_message or f"{field_name} must be less than {threshold}."
        super().__init__(field_name, lambda v: v < threshold if v is not None else True, message, error_code)


class MinRule(FieldConstraintRule):
    """Minimum value or length rule."""
    def __init__(self, field_name, min_val, error_message=None, error_code="min"):
        self.min_val = min_val
        def check_min(v):
            if v is None: return True
            from decimal import Decimal
            if isinstance(v, (int, float, Decimal, complex)): return v >= min_val
            return len(v) >= min_val
        message = error_message or f"{field_name} must be at least {min_val}."
        super().__init__(field_name, check_min, message, error_code)


class MaxRule(FieldConstraintRule):
    """Maximum value or length rule."""
    def __init__(self, field_name, max_val, error_message=None, error_code="max"):
        def check_max(v):
            if v is None: return True
            from decimal import Decimal
            if isinstance(v, (int, float, Decimal, complex)): return v <= max_val
            return len(v) <= max_val
        message = error_message or f"{field_name} must be no more than {max_val}."
        super().__init__(field_name, check_max, message, error_code)


class InRule(FieldConstraintRule):
    """Choices validaton (membership rule)."""
    def __init__(self, field_name, choices, error_message=None, error_code="in"):
        message = error_message or f"{field_name} must be one of: {', '.join(map(str, choices))}."
        super().__init__(field_name, lambda v: v in choices if v is not None else True, message, error_code)


class RequiredRule(BaseRule):
    """Rule to ensure a field is present and not empty."""
    def __init__(self, field_name, error_message=None, error_code="required"):
        message = error_message or f"{field_name} is required."
        super().__init__(message, error_code)
        self.field_name = field_name

    def validate(self, instance, value, context=None):
        trace = context.get("_trace", None) if isinstance(context, dict) else None
        value = getattr(instance, self.field_name, None)
        
        if value is None or (isinstance(value, str) and not value.strip()):
            from core.base_models.exceptions import RuleViolation
            raise RuleViolation(
                message=self.error_message, 
                code=self.error_code,
                field_name=self.field_name
            )

    def check(self, instance):
        # Kept for legacy callers
        value = getattr(instance, self.field_name, None)
        if value is None: return False
        if isinstance(value, str) and not value.strip(): return False
        return True


class EmailRule(FieldConstraintRule):
    """Rule to validate email format."""
    def __init__(self, field_name, error_message=None, error_code="email"):
        regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        message = error_message or f"{field_name} must be a valid email address."
        super().__init__(field_name, lambda v: bool(re.match(regex, v)) if v else True, message, error_code)


class RegexRule(FieldConstraintRule):
    """Rule to validate against a regex pattern."""
    def __init__(self, field_name, pattern, error_message=None, error_code="regex"):
        message = error_message or f"{field_name} format is invalid."
        super().__init__(field_name, lambda v: bool(re.match(pattern, v)) if v else True, message, error_code)


class UniqueRule(BaseRule):
    # ... existing UniqueRule code ...
    # (assuming I already have it and just need to add the new one)
    # Wait, I'll just append it to the end.
    """
    Database-level uniqueness validator.
    
    Unlike standard Django unique=True, this rule allows for 'Scoped Uniqueness'
    (e.g., unique within an organization) and can be checked gracefully 
    before database integrity errors occur.
    """
    def __init__(self, field_name, ignore_pk=True, extra_filters=None, error_message=None, error_code="unique"):
        self.field_name = field_name
        self.ignore_pk = ignore_pk
        self.extra_filters = extra_filters or {}
        message = error_message or f"{field_name} already exists."
        super().__init__(message, error_code)

    def check(self, instance):
        value = getattr(instance, self.field_name, None)
        if value is None: return True
        
        model_class = instance.__class__
        filters = {self.field_name: value}
        
        # Handle dynamic filters (e.g., uniqueness within an organization)
        for k, v in self.extra_filters.items():
            if isinstance(v, str) and hasattr(instance, v):
                filters[k] = getattr(instance, v)
                # If the filter value is a model instance (like organization), use its ID for the filter
                if hasattr(filters[k], 'pk'):
                    filters[k] = filters[k].pk
            else:
                filters[k] = v
                
        queryset = model_class.objects.filter(**filters)
        
        if self.ignore_pk and instance.pk:
            queryset = queryset.exclude(pk=instance.pk)
            
        return not queryset.exists()


class PricingRule(FieldConstraintRule):
    """Rule to ensure pricing JSON contains required keys (currency, monthly)."""
    def __init__(self, field_name="pricing", error_message=None, error_code="pricing_invalid"):
        def check_pricing(v):
            if not isinstance(v, dict): return False
            return all(key in v for key in ["currency", "monthly"])
        
        message = error_message or f"{field_name} must contain 'currency' and 'monthly'."
        super().__init__(field_name, check_pricing, message, error_code)


class RelationKeyRule(BaseRule):
    """
    Rule to ensure a relation (FK) exists and matches specific criteria.
    Example: RelationKeyRule("division", {"company": "company"})
    Ensures division belongs to the same company as the instance.
    """
    def __init__(self, field_name, relation_constraints=None, error_message=None, error_code="relation_invalid"):
        self.field_name = field_name
        self.relation_constraints = relation_constraints or {}
        message = error_message or f"{field_name} relation constraint failed."
        super().__init__(message, error_code)

    def check(self, instance):
        related_obj = getattr(instance, self.field_name, None)
        if not related_obj:
            return True # Use RequiredRule for existence
            
        for related_field, instance_field in self.relation_constraints.items():
            expected_val = getattr(instance, instance_field, None)
            actual_val = getattr(related_obj, related_field, None)
            
            # Extract IDs if they are models
            if hasattr(expected_val, 'pk'): expected_val = expected_val.pk
            if hasattr(actual_val, 'pk'): actual_val = actual_val.pk
            
            if expected_val != actual_val:
                return False
        return True


class JSONKeyRule(FieldConstraintRule):
    """Rule to ensure specific keys exist and have specific types in a JSON dict."""
    def __init__(self, field_name, required_keys=None, types=None, error_message=None, error_code="json_keys_invalid"):
        self.required_keys = required_keys or []
        self.types = types or {} # {key: type}
        
        def check_json(v):
            if v is None: return True
            if not isinstance(v, dict): return False
            for key in self.required_keys:
                if key not in v: return False
                
            for key, expected_type in self.types.items():
                if key in v and not isinstance(v[key], expected_type):
                    return False
            return True
            
        message = error_message or f"{field_name} has invalid structure or missing keys."
        super().__init__(field_name, check_json, message, error_code)


class ListRule(FieldConstraintRule):
    """Rule to ensure a field is a list and optionally contains specific types."""
    def __init__(self, field_name, item_type=None, min_items=0, error_message=None, error_code="list_invalid"):
        def check_list(v):
            if v is None: return True
            if not isinstance(v, list): return False
            if len(v) < min_items: return False
            if item_type:
                return all(isinstance(item, item_type) for item in v)
            return True
            
        message = error_message or f"{field_name} must be a list with at least {min_items} items."
        super().__init__(field_name, check_list, message, error_code)


class ChoiceRule(FieldConstraintRule):
    """Rule to ensure values exist within a provided set of choices (lookups)."""
    def __init__(self, field_name, choices, error_message=None, error_code="choice_invalid"):
        self.choices = choices # Can be a list, set, or callable returning choices
        
        def check_choice(v):
            if v is None: return True
            current_choices = self.choices() if callable(self.choices) else self.choices
            
            if isinstance(v, list):
                return all(item in current_choices for item in v)
            return v in current_choices
            
        message = error_message or f"{field_name} contains invalid choices."
        super().__init__(field_name, check_choice, message, error_code)


class PasswordValidatorRule(BaseRule):
    """
    Rule that wraps Django's internal password validators.
    Uses AUTH_PASSWORD_VALIDATORS from settings.
    """
    def __init__(self, field_name="password", error_message=None, error_code="password_invalid"):
        super().__init__(error_message, error_code)
        self.field_name = field_name

    def check(self, instance):
        password = getattr(instance, self.field_name, None)
        if not password:
            return True # RequiredRule handles existence
            
        try:
            # We pass the instance to allow UserAttributeSimilarityValidator to work
            validate_password(password, user=instance)
            return True
        except DjangoValidationError as e:
            # Note: We are dynamically setting the message based on which Django validator failed
            self.error_message = e.messages[0]
            return False
