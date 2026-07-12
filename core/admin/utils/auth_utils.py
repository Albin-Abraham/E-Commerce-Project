from typing import Any, Union, List, Dict, Optional, Tuple
from django.core.exceptions import PermissionDenied

def check_permission(user: Any, perm_string: str) -> bool:
    """
    Core lookup utility against the user's permission manifest.
    """
    if not user or not user.is_authenticated:
        return False
        
    # 1. High-Performance RBAC Lookup (O(1))
    if hasattr(user, 'permission_manifest'):
        return user.permission_manifest.has_perm(perm_string)
        
    # 2. Standard Django check (handles app_label.codename)
    if user.has_perm(perm_string):
        return True
        
    return False

def evaluate_policy(user: Any, policy: Union[str, List[Any], Dict[str, Any]]) -> bool:
    """
    Recursive engine that processes Bypass -> At-Least -> All -> Any.
    """
    # 1. Bypass Logic (Superuser or System)
    if user and (user.is_superuser or getattr(user, 'is_system', False)):
        return True

    # 2. String (Single Permission)
    if isinstance(policy, str):
        return check_permission(user, policy)

    # 3. List (Default ANY/OR behavior)
    if isinstance(policy, list):
        return any(evaluate_policy(user, p) for p in policy)

    # 4. Dictionary (Structured Logic)
    if isinstance(policy, dict):
        # Handle "at_least": (n, [perms...])
        if "at_least" in policy:
            try:
                count, perms = policy["at_least"]
                return sum(1 for p in perms if evaluate_policy(user, p)) >= count
            except (ValueError, TypeError):
                return False

        # Handle "all" (AND logic)
        results = []
        if "all" in policy:
            results.append(all(evaluate_policy(user, p) for p in policy["all"]))
            
        # Handle "any" (OR logic)
        if "any" in policy:
            results.append(any(evaluate_policy(user, p) for p in policy["any"]))
            
        return all(results) if results else True

    return False

def _find_user_in_args(args: Tuple[Any, ...], kwargs: Dict[str, Any]) -> Optional[Any]:
    """
    Scans arguments to find the 'user' object (Request, User, or kwarg).
    """
    # 1. Look in kwargs['user'] or kwargs['request'].user
    if 'user' in kwargs:
        return kwargs['user']
    if 'request' in kwargs and hasattr(kwargs['request'], 'user'):
        return kwargs['request'].user

    # 2. Look in args
    for arg in args:
        # Is it a Request object?
        if hasattr(arg, 'user'):
            return arg.user
        # Is it a User object (simplified check)?
        if hasattr(arg, 'is_authenticated') and hasattr(arg, 'has_perm'):
            return arg

    return None
