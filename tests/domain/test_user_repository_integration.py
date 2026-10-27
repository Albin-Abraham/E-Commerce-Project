# tests/domain/test_user_repository_integration.py
"""
Integration Tests for DjangoUserRepository, UserDataMapper, and DjangoUnitOfWork.
Verifies the persistence adapter correctly synchronizes pure domain entities with Django ORM.
"""

import pytest

from apps.users.application.use_cases.register_user import (
    RegisterUserInputDTO,
    RegisterUserUseCase,
)
from apps.users.domain.entities import UserEntity
from apps.users.infrastructure.repository import DjangoUserRepository
from core.admin.models.company import Company
from core.infrastructure.uow import DjangoUnitOfWork


@pytest.mark.django_db
class TestDjangoUserRepositoryIntegration:
    """Tests the Infrastructure Repository Adapter with Django DB."""

    def test_save_and_retrieve_user_entity(self):
        repo = DjangoUserRepository()
        user = UserEntity(
            username="repo_test_user",
            email="repotest@example.com",
            full_name="Repo Tester",
        )

        saved = repo.save(user, raw_password="ValidPassword123!")
        assert saved.id is not None

        # Retrieve by ID
        fetched = repo.get_by_id(saved.id)
        assert fetched is not None
        assert fetched.username == "repo_test_user"
        assert fetched.email == "repotest@example.com"
        assert fetched.is_active is True

        # Retrieve by email
        by_email = repo.get_by_email("repotest@example.com")
        assert by_email is not None
        assert by_email.id == saved.id

    def test_register_use_case_with_django_infrastructure(self):
        company = Company.objects.create(name="Acme Corp", code="ACME")
        repo = DjangoUserRepository()
        uow = DjangoUnitOfWork()
        use_case = RegisterUserUseCase(user_repo=repo, uow=uow)

        dto = RegisterUserInputDTO(
            username="real_integration_user",
            email="real_integration@example.com",
            password="RealPassword123!",
            full_name="Integration User",
            company_id=str(company.id),
        )

        output = use_case.execute(dto)
        assert output.user_id is not None
        assert output.username == "real_integration_user"

        # Verify DB persistence and tenant profile assignment
        persisted = repo.get_by_id(output.user_id)
        assert persisted is not None
        assert persisted.company_id == str(company.id)
