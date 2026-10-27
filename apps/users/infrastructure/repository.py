# apps/users/infrastructure/repository.py
"""
DjangoUserRepository — Concrete implementation of IUserRepository.
Encapsulates all Django ORM database queries for the User aggregate.
"""

from apps.users.domain.entities import UserEntity
from apps.users.domain.repository import IUserRepository
from apps.users.infrastructure.mappers import UserDataMapper
from apps.users.models.users import UserModel


class DjangoUserRepository(IUserRepository):
    """
    Repository implementation using Django ORM.
    """

    def get_by_id(self, user_id: str) -> UserEntity | None:
        model = UserModel.objects.select_related("profile").filter(id=user_id).first()
        return UserDataMapper.to_domain(model) if model else None

    def get_by_email(self, email: str) -> UserEntity | None:
        model = UserModel.objects.select_related("profile").filter(email=email).first()
        return UserDataMapper.to_domain(model) if model else None

    def get_by_username(self, username: str) -> UserEntity | None:
        model = UserModel.objects.select_related("profile").filter(username=username).first()
        return UserDataMapper.to_domain(model) if model else None

    def save(self, user: UserEntity, raw_password: str | None = None) -> UserEntity:
        existing = UserModel.objects.filter(id=user.id).first() if user.id else None
        model = UserDataMapper.to_orm(user, existing)

        if raw_password:
            model.set_password(raw_password)

        model.save()
        user.id = str(model.id)

        # Update profile association if specified
        if user.company_id or user.branch_id:
            profile = getattr(model, "profile", None)
            if profile:
                if user.company_id:
                    profile.company_id = user.company_id
                if user.branch_id:
                    profile.branch_id = user.branch_id
                profile.save(update_fields=["company_id", "branch_id"])

        return user

    def delete(self, user_id: str) -> bool:
        deleted_count, _ = UserModel.objects.filter(id=user_id).delete()
        return deleted_count > 0

    def is_active(self, user_id: str) -> bool:
        return UserModel.objects.filter(id=user_id, is_active=True).exists()
