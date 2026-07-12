from functools import wraps
from typing import Any, Union, List, Dict
from django.core.exceptions import PermissionDenied
from core.admin.utils.auth_utils import evaluate_policy, _find_user_in_args

def required_permission(perm_expr: Union[str, List[Any], Dict[str, Any]]):
    """
    Universal decorator to enforce permissions across different application layers.
    
    Works with:
        - Django FBVs: def my_view(request, ...)
        - DRF Actions: def my_action(self, request, ...)
        - Service Methods: def my_service(self, user, ...)
        - Logic Functions: def my_logic(user=user, ...)
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # 1. Detect the Actor (the User)
            user = _find_user_in_args(args, kwargs)
            
            # 2. Evaluate the Permission Policy
            if not evaluate_policy(user, perm_expr):
                raise PermissionDenied(f"Security Policy Violation: Missing required permission(s) for {func.__name__}")
            
            return func(*args, **kwargs)
        return wrapper
    return decorator
