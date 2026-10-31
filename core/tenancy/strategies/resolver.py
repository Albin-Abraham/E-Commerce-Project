# core/tenancy/strategies/resolver.py
from typing import ClassVar

from django.db.models import Model

from core.context.request_context import RequestContext
from core.tenancy.strategies.base import IScopingStrategy
from core.tenancy.strategies.customer_ownership import CustomerOwnershipStrategy
from core.tenancy.strategies.public_catalog import PublicCatalogStrategy
from core.tenancy.strategies.staff_hierarchy import StaffHierarchyStrategy
from core.tenancy.strategies.vendor_supplier import VendorSupplierStrategy


class ScopingStrategyResolver:
    """
    Resolves the appropriate IScopingStrategy for a given model and caller RequestContext.
    """

    _customer_strategy = CustomerOwnershipStrategy()
    _vendor_strategy = VendorSupplierStrategy()
    _staff_strategy = StaffHierarchyStrategy()
    _public_strategy = PublicCatalogStrategy()

    # Entities that allow public browsing for customers/anonymous
    PUBLIC_STOREFRONT_ENTITIES: ClassVar[set[str]] = {
        "Product",
        "Category",
        "Brand",
        "Catalog",
        "CatalogItem",
    }

    @classmethod
    def resolve_for(cls, model_class: type[Model], context: RequestContext) -> IScopingStrategy:
        """Determines the data scoping boundary strategy for the caller."""
        # 1. Custom model override
        if hasattr(model_class, "get_scoping_strategy"):
            custom = getattr(model_class, "get_scoping_strategy")(context)
            if custom and isinstance(custom, IScopingStrategy):
                return custom

        # 2. Public Catalog Browsing (Storefront Customers & Guests)
        if model_class.__name__ in cls.PUBLIC_STOREFRONT_ENTITIES and context.persona in (
            "CUSTOMER",
            "ANONYMOUS",
        ):
            return cls._public_strategy

        # 3. Customer Personal Data (Carts, Orders, Addresses)
        if context.persona == "CUSTOMER":
            return cls._customer_strategy

        # 4. Vendor / Merchant Portal
        if context.persona == "VENDOR":
            return cls._vendor_strategy

        # 5. Staff / Corporate ERP
        if context.persona == "STAFF":
            return cls._staff_strategy

        # Default fallback: safe isolation
        return (
            cls._public_strategy
            if model_class.__name__ in cls.PUBLIC_STOREFRONT_ENTITIES
            else cls._customer_strategy
        )
