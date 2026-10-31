# core/context/object_context.py
from dataclasses import dataclass


@dataclass(frozen=True)
class ObjectContext:
    """
    Immutable Target Resource Context.
    Represents the verified server-side business object being operated on.
    Must always be constructed from trusted database records, never from raw client inputs.
    """

    resource_type: str
    resource_id: str
    owner_id: str | None = None
    customer_id: str | None = None
    company_id: str | None = None
    supplier_id: str | None = None
    branch_id: str | None = None
    is_public: bool = False
