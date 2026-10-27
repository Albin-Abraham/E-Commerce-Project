# apps/users/services/interfaces.py
from abc import ABC, abstractmethod
from typing import Any

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
    def get_auth_token(self, request: HttpRequest) -> str | None:
        """Extracts the active auth token from headers or cookies."""
        pass


class IUserSessionClassServices(ABC):
    """
    Industrialized Contract for User Session and Context.
    Manages tenant scoping, profile data, and session lifecycle.
    """

    @abstractmethod
    def get_user_profile(self, request: HttpRequest) -> dict[str, Any]:
        """Returns the non-sensitive profile manifest for the current user."""
        pass


class IPasswordService(ABC):
    """Contract for password management operations."""

    @abstractmethod
    def generate_password_reset_token(self, email: str) -> dict[str, Any]:
        pass

    @abstractmethod
    def reset_password_with_token(self, token: str, new_password: str) -> bool:
        pass


class IUserManagementService(ABC):
    """Contract for user CRUD operations."""

    @abstractmethod
    def list_users(self, filters: dict[str, Any] = None) -> list[dict[str, Any]]:
        pass

    @abstractmethod
    def get_user(self, user_id: str) -> dict[str, Any] | None:
        pass

    @abstractmethod
    def deactivate_user(self, user_id: str) -> bool:
        pass

    @abstractmethod
    def activate_user(self, user_id: str) -> bool:
        pass

    @abstractmethod
    def assign_role(self, user_id: str, role_id: str) -> bool:
        pass

    @abstractmethod
    def remove_role(self, user_id: str, role_id: str) -> bool:
        pass
