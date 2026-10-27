# apps/users/domain/repository.py
"""
IUserRepository — Domain Repository Interface for User aggregate.
Defines data persistence boundary without framework coupling.
"""

from abc import ABC, abstractmethod

from apps.users.domain.entities import UserEntity


class IUserRepository(ABC):
    """
    Contract for User data access.
    """

    @abstractmethod
    def get_by_id(self, user_id: str) -> UserEntity | None:
        """Retrieve user by UUID/ID string."""
        pass

    @abstractmethod
    def get_by_email(self, email: str) -> UserEntity | None:
        """Retrieve user by email address."""
        pass

    @abstractmethod
    def get_by_username(self, username: str) -> UserEntity | None:
        """Retrieve user by username."""
        pass

    @abstractmethod
    def save(self, user: UserEntity, raw_password: str | None = None) -> UserEntity:
        """Persist user entity changes."""
        pass

    @abstractmethod
    def delete(self, user_id: str) -> bool:
        """Remove user entity."""
        pass

    @abstractmethod
    def is_active(self, user_id: str) -> bool:
        """Verify active status of user."""
        pass
