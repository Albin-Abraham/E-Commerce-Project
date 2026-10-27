# apps/users/infrastructure/mappers.py
"""
UserDataMapper — Translates between pure UserEntity and Django UserModel.
Maintains bidirectional mapping while isolating domain logic from the ORM.
"""

from apps.users.domain.entities import UserEntity
from apps.users.models.users import UserModel


class UserDataMapper:
    """
    Data Mapper for the User Aggregate.
    """

    @staticmethod
    def to_domain(model: UserModel) -> UserEntity:
        """Map Django UserModel to pure UserEntity."""
        profile = getattr(model, "profile", None)
        company_id = str(profile.company_id) if profile and profile.company_id else None
        branch_id = str(profile.branch_id) if profile and profile.branch_id else None

        entity = UserEntity(
            id=str(model.id),
            username=model.username,
            email=model.email,
            full_name=model.full_name or "",
            password=model.password,
            is_active=model.is_active,
            is_staff=model.is_staff,
            is_superuser=model.is_superuser,
            company_id=company_id,
            branch_id=branch_id,
            created_at=getattr(model, "date_joined", None),
        )
        return entity

    @staticmethod
    def to_orm(entity: UserEntity, existing_model: UserModel | None = None) -> UserModel:
        """Map pure UserEntity to Django UserModel."""
        model = existing_model or UserModel()
        if entity.id:
            model.id = entity.id
        model.username = entity.username
        model.email = entity.email
        model.full_name = entity.full_name
        model.is_active = entity.is_active
        model.is_staff = entity.is_staff
        model.is_superuser = entity.is_superuser
        return model
