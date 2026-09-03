from abc import ABC, abstractmethod
from typing import Any
from uuid import UUID


class ITenantRepository(ABC):
    """Contract for verifying tenant existence and linkages."""

    @abstractmethod
    def company_exists(self, company_id: str | UUID) -> bool:
        pass

    @abstractmethod
    def business_unit_exists_in_company(
        self, bu_id: str | UUID, company_id: str | UUID | None
    ) -> bool:
        pass

    @abstractmethod
    def branch_exists_in_hierarchy(
        self,
        branch_id: str | UUID,
        bu_id: str | UUID | None,
        company_id: str | UUID | None,
    ) -> bool:
        pass


class ITenantAuthorizationService(ABC):
    """Contract for verifying user access to a tenant entity."""

    @abstractmethod
    def is_superuser(self, user: Any) -> bool:
        pass

    @abstractmethod
    def user_has_access(self, user: Any, entity_type: str, entity_id: str | UUID) -> bool:
        pass
