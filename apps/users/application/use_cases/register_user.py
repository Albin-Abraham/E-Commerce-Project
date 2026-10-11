# apps/users/application/use_cases/register_user.py
"""
RegisterUserUseCase — Application Use Case for registering a user.
Strictly decoupled from Django ORM, HTTP framework, and database engines.
"""

from dataclasses import dataclass
from typing import Optional
from apps.users.domain.entities import UserEntity
from apps.users.domain.repository import IUserRepository
from shared_domain.base.unit_of_work import IUnitOfWork
from shared_domain.validation.exceptions import DomainValidationError


@dataclass(frozen=True)
class RegisterUserInputDTO:
    username: str
    email: str
    password: str
    full_name: str = ""
    company_id: Optional[str] = None
    branch_id: Optional[str] = None


@dataclass(frozen=True)
class RegisterUserOutputDTO:
    user_id: str
    username: str
    email: str
    full_name: str
    is_active: bool


class RegisterUserUseCase:
    """
    Executes the user registration workflow within transactional boundaries.
    """

    def __init__(self, user_repo: IUserRepository, uow: IUnitOfWork):
        self.user_repo = user_repo
        self.uow = uow

    def execute(self, dto: RegisterUserInputDTO) -> RegisterUserOutputDTO:
        # Technical & Domain invariant validation
        if not dto.email or "@" not in dto.email:
            raise DomainValidationError("Invalid email address provided.", errors={"email": "Invalid email address format."})
        if not dto.username or len(dto.username.strip()) < 3:
            raise DomainValidationError("Username must be at least 3 characters long.", errors={"username": "Too short."})
        if not dto.password or len(dto.password) < 6:
            raise DomainValidationError("Password must be at least 6 characters long.", errors={"password": "Too short."})

        # Uniqueness invariants
        if self.user_repo.get_by_email(dto.email):
            raise DomainValidationError(f"User with email '{dto.email}' already exists.", errors={"email": "Email already in use."})
        if self.user_repo.get_by_username(dto.username):
            raise DomainValidationError(f"Username '{dto.username}' is already taken.", errors={"username": "Username already taken."})

        # Transactional domain aggregate creation
        with self.uow:
            user = UserEntity(
                username=dto.username.strip(),
                email=dto.email.strip().lower(),
                full_name=dto.full_name.strip(),
                company_id=dto.company_id,
                branch_id=dto.branch_id,
            )
            saved_user = self.user_repo.save(user, raw_password=dto.password)
            self.uow.commit()

        return RegisterUserOutputDTO(
            user_id=saved_user.id or "",
            username=saved_user.username,
            email=saved_user.email,
            full_name=saved_user.full_name,
            is_active=saved_user.is_active,
        )
