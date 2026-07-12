from typing import Any, Optional, Union, List, Dict
try:
    from django.core.exceptions import PermissionDenied, ValidationError
except ImportError:
    # Fallback for non-django environments during testing
    class PermissionDenied(Exception): pass
    class ValidationError(Exception): pass


class ValidationMode:
    """
    Standard modes to replace boolean 'strict' flags.
    """
    CREATE = "create"
    UPDATE = "update"
    SUBMIT = "submit"
    SYSTEM = "system"
    DRAFT = "draft"


class Rule:
    """
    Base strategy for validation rules.
    """
    def applies(self, value: Any, instance: Optional[Any], context: Optional[Any]) -> bool:
        """
        Determine if the rule should be executed based on instance state or context.
        """
        return True

    def validate(self, value: Any, instance: Optional[Any], context: Optional[Any]) -> None:
        """
        Execute the validation logic. Raise ValidationError if failed.
        """
        raise NotImplementedError("Each rule must implement its own validate method.")


class RequiredRule(Rule):
    """
    Standard Strategy: Multi-context Requirement.
    """
    def applies(self, value, instance, context):
        # Handle both string (legacy) and dict (new) context
        mode = context.get("mode") if isinstance(context, dict) else context
        
        # e.g., Skip for drafts, enforce for submit/create
        if mode == ValidationMode.DRAFT:
            return False
        return True

    def validate(self, value, instance, context):
        if not value:
            # Note: We'll use a generic ValidationError that can be mapped to DRF or Django
            from django.core.exceptions import ValidationError
            raise ValidationError("This field is required in the current context.")


class MinRule(Rule):
    """
    Strategy: Minimum value or length.
    """
    def __init__(self, min_val: int):
        self.min_val = min_val

    def validate(self, value, instance, context):
        if value is None:
            return
        
        valid = False
        if isinstance(value, (int, float)):
            valid = value >= self.min_val
        else:
            valid = len(str(value)) >= self.min_val
            
        if not valid:
            from django.core.exceptions import ValidationError
            raise ValidationError(f"Ensure this value has at least {self.min_val} characters.")


class LegacyRuleAdapter(Rule):
    """
    Adapter Pattern: Bridge legacy BaseRule (check method) to new Rule (validate method).
    """
    def __init__(self, legacy_rule):
        self.legacy_rule = legacy_rule

    def applies(self, value, instance, context):
        return True

    def validate(self, value, instance, context):
        if not self.legacy_rule.check(instance):
            from django.core.exceptions import ValidationError
            raise ValidationError(self.legacy_rule.error_message)


class PermissionPolicyRule(Rule):
    """
    Strategy: Authorization Policy Enforcement.
    Leverages evaluate_policy to check complex permission expressions.
    """
    def __init__(self, policy: Union[str, List[Any], Dict[str, Any]], field_name: Optional[str] = None):
        self.policy = policy
        self.field_name = field_name

    def validate(self, value: Any, instance: Optional[Any], context: Optional[Any]) -> None:
        from core.admin.utils.auth_utils import evaluate_policy
        
        # 1. Capture User from Context
        user = None
        if isinstance(context, dict):
            user = context.get('user')
        elif hasattr(context, 'user'):
            user = context.user
            
        # 2. Evaluate Policy
        if not evaluate_policy(user, self.policy):
            from django.core.exceptions import PermissionDenied
            raise PermissionDenied(f"Security Policy Violation: Missing permission for {self.policy}")
