# apps/users/services/interfaces.py
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from django.http import HttpRequest

class IAuthenticationClassService(ABC):
    """
    Industrialized Contract for Authentication Operations.
    Handles token validation, platform-specific auth logic, and identity verification.
    """

    @abstractmethod
    def is_authenticated(self, request: HttpRequest) -> bool:
        """Verifies if the current request is authenticated."""
        pass

    @abstractmethod
    def get_auth_token(self, request: HttpRequest) -> Optional[str]:
        """Extracts the active auth token from headers or cookies."""
        pass

class IUserSessionClassServices(ABC):
    """
    Industrialized Contract for User Session and Context.
    Manages tenant scoping, profile data, and session lifecycle.
    """

    @abstractmethod
    def get_user_profile(self, request: HttpRequest) -> Dict[str, Any]:
        """Returns the non-sensitive profile manifest for the current user."""
        pass
