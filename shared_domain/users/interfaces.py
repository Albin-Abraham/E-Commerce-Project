from abc import ABC, abstractmethod

from .entities import UserEntity


class IUserRepository(ABC):
    """
    Contract for User Data Access.
    Abstracts away the underlying ORM/Database details.
    """

    @abstractmethod
    def get_by_id(self, user_id: str) -> UserEntity | None:
        pass

    @abstractmethod
    def get_by_email(self, email: str) -> UserEntity | None:
        pass

    @abstractmethod
    def save(self, user: UserEntity) -> UserEntity:
        pass

    @abstractmethod
    def delete(self, user_id: str) -> bool:
        pass

    @abstractmethod
    def get_permission_manifest(self, user_id: str) -> dict:
        pass

    @abstractmethod
    def is_active(self, user_id: str) -> bool:
        pass

    @abstractmethod
    def get_profile_summary(self, user_id: str) -> dict:
        pass
