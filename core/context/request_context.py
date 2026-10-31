# core/context/request_context.py
from dataclasses import dataclass, field
from typing import Any


@dataclass(frozen=True)
class RequestContext:
    """
    Immutable Execution Context.
    Represents the authenticated caller and their current operational scope.
    """

    user_id: str | None = None
    persona: str = "ANONYMOUS"  # CUSTOMER, VENDOR, STAFF, ANONYMOUS
    customer_id: str | None = None
    company_id: str | None = None
    supplier_id: str | None = None
    branch_id: str | None = None
    business_unit_id: str | None = None
    request_id: str | None = None
    ip_address: str | None = None
    permissions: frozenset[str] = field(default_factory=frozenset)
    metadata: dict[str, Any] = field(default_factory=dict)

    @property
    def is_authenticated(self) -> bool:
        return bool(self.user_id)

    @property
    def is_customer(self) -> bool:
        return self.persona == "CUSTOMER"

    @property
    def is_vendor(self) -> bool:
        return self.persona == "VENDOR"

    @property
    def is_staff(self) -> bool:
        return self.persona == "STAFF"
