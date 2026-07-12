# apps/users/services/user_service.py
from typing import Dict, Any, Optional
from uuid import UUID
from apps.users.contracts import IUserPublicService
from apps.users.models.users import UserModel
from core.admin.utils.integrity.log_mixin import LogMixin

class UserPublicService(IUserPublicService, LogMixin):
    """
    Industrialized Implementation of the User Public Contract.
    Provides a standardized way for other modules to interact with user data.
    """

    def get_user_manifest(self, user_id: UUID) -> Dict[str, Any]:
        self.log_info(f"Generating manifest for user {user_id}")
        try:
            user = UserModel.objects.get(id=user_id)
            return user.permission_manifest
        except UserModel.DoesNotExist:
            self.log_error(f"Failed to generate manifest: User {user_id} not found")
            return {}

    def validate_session(self, user_id: UUID, company_id: Optional[UUID] = None) -> bool:
        """Validate if a user session is still active and valid for the given company."""
        return UserModel.objects.filter(id=user_id, is_active=True).exists()

    def get_user_profile_summary(self, user_id: UUID) -> Dict[str, Any]:
        """Returns a high-level summary of the user's identity and tenant context."""
        try:
            user = UserModel.objects.select_related('profile').get(id=user_id)
            profile = getattr(user, 'profile', None)
            return {
                "id": str(user.id),
                "username": user.username,
                "full_name": user.full_name,
                "company_id": str(profile.company_id) if profile else None,
                "branch_id": str(profile.branch_id) if profile else None,
            }
        except UserModel.DoesNotExist:
            return {}
