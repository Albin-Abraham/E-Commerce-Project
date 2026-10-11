# apps/shop/domain/events.py
"""
Domain Events for the Shop / Inventory bounded context.
Pure Python, framework agnostic.
"""

from dataclasses import dataclass
from typing import ClassVar
from shared_domain.base.event import DomainEvent


@dataclass(frozen=True)
class InventoryStockReserved(DomainEvent):
    event_name: ClassVar[str] = "shop.inventory.stock_reserved"
    inventory_id: str = ""
    quantity: int = 0


@dataclass(frozen=True)
class InventoryStockReleased(DomainEvent):
    event_name: ClassVar[str] = "shop.inventory.stock_released"
    inventory_id: str = ""
    quantity: int = 0


@dataclass(frozen=True)
class InventoryStockCommitted(DomainEvent):
    event_name: ClassVar[str] = "shop.inventory.stock_committed"
    inventory_id: str = ""
    quantity: int = 0
