from enum import StrEnum
from core.registry.variable_registry import DomainVariableRegistry


class ShopVariableKey(StrEnum):
    """
    App-Scoped Variable Keys for Shop & Inventory Module.
    """
    QUANTITY = "quantity"
    RESERVED_QUANTITY = "reserved_quantity"
    AVAILABLE_QUANTITY = "available_quantity"
    REORDER_POINT = "reorder_point"
    UNIT_COST = "unit_cost"
    SKU = "sku"


DomainVariableRegistry.register_app_variables("shop", ShopVariableKey)
