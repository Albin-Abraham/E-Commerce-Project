from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Optional
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
    password: Optional[str] = None
    is_active: bool = True
    is_staff: bool = False
    is_superuser: bool = False
    company_id: Optional[str] = None
    branch_id: Optional[str] = None
    created_at: Optional[datetime] = None

    def deactivate(self) -> None:
        if self.is_superuser:
            raise DomainValidationError("Superuser cannot be deactivated.", errors={"is_active": "Superuser cannot be deactivated."})
        self.is_active = False

    def activate(self) -> None:
        self.is_active = True

    def assign_company(self, company_id: str, branch_id: Optional[str] = None) -> None:
        if not company_id:
            raise DomainValidationError("Company ID is required.", errors={"company_id": "Cannot be empty."})
        self.company_id = str(company_id)
        if branch_id:
            self.branch_id = str(branch_id)
