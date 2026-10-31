# core/context/context_builder.py
from typing import Any

from core.context.object_context import ObjectContext


class ObjectContextBuilder:
    """
    Trusted Server-Side ObjectContext Extractor.
    Extracts security and ownership context from database models without trusting client input.
    """

    @classmethod
    def from_object(cls, obj: Any) -> ObjectContext:
        """Constructs an immutable ObjectContext from an ORM or domain entity."""
        if obj is None:
            raise ValueError("Cannot build ObjectContext from None")

        resource_type = obj.__class__.__name__.lower()
        resource_id = str(getattr(obj, "id", getattr(obj, "pk", "")))

        # Extract ownership attributes safely across different model patterns
        owner_id = str(getattr(obj, "user_id", "")) or None
        if not owner_id and hasattr(obj, "user"):
            user_val = getattr(obj, "user")
            owner_id = str(getattr(user_val, "id", user_val)) if user_val else None

        customer_id = str(getattr(obj, "customer_id", "")) or None
        if not customer_id and hasattr(obj, "customer"):
            cust_val = getattr(obj, "customer")
            customer_id = str(getattr(cust_val, "id", cust_val)) if cust_val else None

        company_id = str(getattr(obj, "company_id", "")) or None
        if not company_id and hasattr(obj, "company"):
            comp_val = getattr(obj, "company")
            company_id = str(getattr(comp_val, "id", comp_val)) if comp_val else None

        supplier_id = str(getattr(obj, "supplier_id", "")) or None
        if not supplier_id and hasattr(obj, "supplier"):
            sup_val = getattr(obj, "supplier")
            supplier_id = str(getattr(sup_val, "id", sup_val)) if sup_val else None

        branch_id = str(getattr(obj, "branch_id", "")) or None
        if not branch_id and hasattr(obj, "branch"):
            br_val = getattr(obj, "branch")
            branch_id = str(getattr(br_val, "id", br_val)) if br_val else None

        is_public = bool(getattr(obj, "is_public", getattr(obj, "is_active", False)))

        return ObjectContext(
            resource_type=resource_type,
            resource_id=resource_id,
            owner_id=owner_id,
            customer_id=customer_id,
            company_id=company_id,
            supplier_id=supplier_id,
            branch_id=branch_id,
            is_public=is_public,
        )
