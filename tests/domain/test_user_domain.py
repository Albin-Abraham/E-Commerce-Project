# tests/domain/test_user_domain.py
"""
Pure Domain & Application Use Case Unit Tests.
Runs in-memory with zero framework or database dependencies.
"""

import pytest

from apps.users.application.use_cases.register_user import (
    RegisterUserInputDTO,
    RegisterUserUseCase,
)
from apps.users.domain.entities import UserEntity
from apps.users.domain.repository import IUserRepository
from shared_domain.base.event import DomainEvent
from shared_domain.base.unit_of_work import IUnitOfWork
from shared_domain.validation.exceptions import DomainValidationError


class InMemoryUnitOfWork(IUnitOfWork):
    def __init__(self):
        self.committed = False
        self.rolled_back = False

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            self.rolled_back = True

    def commit(self):
        self.committed = True

    def rollback(self):
        self.rolled_back = True


class InMemoryUserRepository(IUserRepository):
    def __init__(self):
        self._storage: dict[str, UserEntity] = {}
        self._id_counter = 1

    def get_by_id(self, user_id: str) -> UserEntity | None:
        return self._storage.get(user_id)

    def get_by_email(self, email: str) -> UserEntity | None:
        for u in self._storage.values():
            if u.email == email.lower():
                return u
        return None

    def get_by_username(self, username: str) -> UserEntity | None:
        for u in self._storage.values():
            if u.username == username:
                return u
        return None

    def save(self, user: UserEntity, raw_password: str | None = None) -> UserEntity:
        if not user.id:
            user.id = f"usr_{self._id_counter}"
            self._id_counter += 1
        self._storage[user.id] = user
        return user

    def delete(self, user_id: str) -> bool:
        return self._storage.pop(user_id, None) is not None

    def is_active(self, user_id: str) -> bool:
        u = self._storage.get(user_id)
        return u.is_active if u else False


class TestUserEntityDomain:
    """Domain Layer Invariant Checks (Zero DB)."""

    def test_create_user_entity_default_state(self):
        user = UserEntity(username="alice", email="alice@example.com")
        assert user.is_active is True
        assert user.is_staff is False
        assert user.is_superuser is False

    def test_deactivate_regular_user(self):
        user = UserEntity(username="bob", email="bob@example.com")
        user.deactivate()
        assert user.is_active is False

    def test_deactivate_superuser_raises_invariant_error(self):
        superuser = UserEntity(username="admin", email="admin@example.com", is_superuser=True)
        with pytest.raises(DomainValidationError) as exc:
            superuser.deactivate()
        assert "Superuser cannot be deactivated" in str(exc.value)

    def test_aggregate_root_domain_events(self):
        user = UserEntity(id="u123", username="carol", email="carol@example.com")
        event = DomainEvent(aggregate_id=user.id, aggregate_type="User")
        user.record_event(event)

        events = user.pull_events()
        assert len(events) == 1
        assert events[0].aggregate_id == "u123"
        # Subsequent pull should be empty
        assert len(user.pull_events()) == 0


class TestRegisterUserUseCase:
    """Application Layer Use Case Checks (Mocked Repository & In-Memory UoW)."""

    def test_successful_registration(self):
        repo = InMemoryUserRepository()
        uow = InMemoryUnitOfWork()
        use_case = RegisterUserUseCase(user_repo=repo, uow=uow)

        dto = RegisterUserInputDTO(
            username="newuser",
            email="newuser@example.com",
            password="StrongPassword123!",
            full_name="New User",
            company_id="comp_1",
        )

        output = use_case.execute(dto)
        assert output.user_id.startswith("usr_")
        assert output.username == "newuser"
        assert output.email == "newuser@example.com"
        assert uow.committed is True

        # Verify persisted in repo
        persisted = repo.get_by_id(output.user_id)
        assert persisted is not None
        assert persisted.company_id == "comp_1"

    def test_duplicate_email_raises_domain_error(self):
        repo = InMemoryUserRepository()
        uow = InMemoryUnitOfWork()
        use_case = RegisterUserUseCase(user_repo=repo, uow=uow)

        # Pre-seed existing user
        repo.save(UserEntity(username="existing", email="test@example.com"))

        dto = RegisterUserInputDTO(
            username="another",
            email="test@example.com",
            password="StrongPassword123!",
        )

        with pytest.raises(DomainValidationError) as exc:
            use_case.execute(dto)
        assert "already exists" in str(exc.value)
        assert uow.committed is False

    def test_duplicate_username_raises_domain_error(self):
        repo = InMemoryUserRepository()
        uow = InMemoryUnitOfWork()
        use_case = RegisterUserUseCase(user_repo=repo, uow=uow)

        repo.save(UserEntity(username="taken_user", email="user1@example.com"))

        dto = RegisterUserInputDTO(
            username="taken_user",
            email="user2@example.com",
            password="StrongPassword123!",
        )

        with pytest.raises(DomainValidationError) as exc:
            use_case.execute(dto)
        assert "already taken" in str(exc.value)
