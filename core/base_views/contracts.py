# core/base_views/contracts.py
from abc import ABC, abstractmethod
from typing import Any, Optional
from django.http import HttpRequest

class IHttpRequest(ABC):
    """
    Interface for safe HTTP Request access.
    Standardizes how platform components retrieve the request context.
    """
    @property
    @abstractmethod
    def platform_request(self) -> Optional[HttpRequest]:
        pass

class IUserClassAPI(ABC):
    """
    Interface for safe User Identity access.
    Standardizes how platform components retrieve the authenticated user.
    """
    @property
    @abstractmethod
    def platform_user(self) -> Any:
        pass

class IPublicContract(IHttpRequest, IUserClassAPI):
    """
    Unified Public Contract for View context.
    Combines Request and User into a single architectural anchor.
    """
    pass
