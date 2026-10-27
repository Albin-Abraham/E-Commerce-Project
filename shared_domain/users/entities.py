from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime

from shared_domain.base.aggregate import AggregateRoot
from shared_domain.validation.exceptions import DomainValidationError


@dataclass
class UserEntity(AggregateRoot):
    """
    Pure Python domain entity representing a user in the system.
    Shared contract across domain contexts.
    """

    username: str = ""
    email: str = ""
    full_name: str = ""
    password: str | None = None
    is_active: bool = True
    is_staff: bool = False
    is_superuser: bool = False
    company_id: str | None = None
    branch_id: str | None = None
    created_at: datetime | None = None

    def deactivate(self) -> None:
        if self.is_superuser:
            raise DomainValidationError(
                "Superuser cannot be deactivated.",
                errors={"is_active": "Superuser cannot be deactivated."},
            )
        self.is_active = False

    def activate(self) -> None:
        self.is_active = True

    def assign_company(self, company_id: str, branch_id: str | None = None) -> None:
        if not company_id:
            raise DomainValidationError(
                "Company ID is required.", errors={"company_id": "Cannot be empty."}
            )
        self.company_id = str(company_id)
        if branch_id:
            self.branch_id = str(branch_id)
