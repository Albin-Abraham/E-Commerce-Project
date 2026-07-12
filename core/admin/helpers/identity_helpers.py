# core/admin/helpers/identity_helpers.py
from functools import wraps
from typing import Any, Callable, Protocol, TypeVar, Union, List

class IIdentityContract(Protocol):
    """
    Public Contract API for Identity.
    Guarantees any implementing class has a property-based identity getter and setter.
    """
    @property
    def identity(self) -> dict:
        ...
        
    @identity.setter
    def identity(self, value: Any):
        ...

T = TypeVar('T')

def identity_aware(func: Callable[..., Union[IIdentityContract, List[IIdentityContract], T]]) -> Callable:
    """
    GoF Decorator Pattern: Ensures a function/method returns an Identity Package.
    Automatically resolves model instances to their {id, label} representation.
    
    Uses @wraps to preserve metadata for OpenAPI/Spectacular introspection.
    """
    @wraps(func)
    def wrapper(*args, **kwargs) -> Any:
        # Execute the original logic
        result = func(*args, **kwargs)
        
        # 1. Handle Single Instance conforming to IIdentityContract
        if hasattr(result, 'identity'):
            return result.identity
            
        # 2. Handle List of Instances
        if isinstance(result, list):
            return [
                item.identity if hasattr(item, 'identity') else item 
                for item in result
            ]
            
        return result
    return wrapper
