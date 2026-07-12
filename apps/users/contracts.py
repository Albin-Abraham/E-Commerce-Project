# apps/users/contracts.py
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List
from uuid import UUID

class IUserPublicService(ABC):
    """
    Public Contract for the Users Module.
    Defines the 'Black Box' interface for inter-module communication.
    """

    @abstractmethod
    def get_user_manifest(self, user_id: UUID) -> Dict[str, Any]:
        """Returns RBAC and identity manifest for a user."""
        pass

    @abstractmethod
    def validate_session(self, user_id: UUID, company_id: Optional[UUID] = None) -> bool:
        """Verifies if a user's session is valid for the given company context."""
        pass

    @abstractmethod
    def get_user_profile_summary(self, user_id: UUID) -> Dict[str, Any]:
        """Returns a non-sensitive summary of the user's profile."""
        pass

    @abstractmethod
    def get_user_permissions(self, user_id: UUID) -> List[str]:
        """Returns the list of permission keys for a user."""
        pass

    @abstractmethod
    def check_user_permission(self, user_id: UUID, permission_key: str) -> bool:
        """Checks if a user has a specific permission."""
        pass
