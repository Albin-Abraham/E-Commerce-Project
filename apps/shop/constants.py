from enum import StrEnum
from core.registry.variable_registry import DomainVariableRegistry


class ShopVariableKey(StrEnum):
    """
    App-Scoped Variable Keys for Shop & Catalog Module.
    """
    QUANTITY = "quantity"
    RESERVED_QUANTITY = "reserved_quantity"
    AVAILABLE_QUANTITY = "available_quantity"
    REORDER_POINT = "reorder_point"
    UNIT_COST = "unit_cost"
    SKU = "sku"
    PRODUCT_STATUS_ACTIVE = "ACTIVE"
    PRODUCT_STATUS_INACTIVE = "INACTIVE"
    PRODUCT_STATUS_DRAFT = "DRAFT"


class InventoryKeys(StrEnum):
    """
    App-Scoped Variable Keys for Inventory Sub-Domain.
    """
    SERIAL_STATUS_IN_STOCK = "IN_STOCK"
    SERIAL_STATUS_SOLD = "SOLD"
    SERIAL_STATUS_DEFECTIVE = "DEFECTIVE"
    STOCK_TRANSFER_DRAFT = "DRAFT"
    STOCK_TRANSFER_IN_TRANSIT = "IN_TRANSIT"
    STOCK_TRANSFER_COMPLETED = "COMPLETED"
    UOM_TYPE_COUNT = "COUNT"
    UOM_TYPE_WEIGHT = "WEIGHT"
    UOM_TYPE_VOLUME = "VOLUME"
    UOM_TYPE_LENGTH = "LENGTH"
    UOM_TYPE_TIME = "TIME"


DomainVariableRegistry.register_app_variables("shop", ShopVariableKey)
DomainVariableRegistry.register_app_variables("inventory", InventoryKeys)
