# apps/shop/domain/repository.py
"""
Repository Interfaces for the Shop domain.
Pure Python abstract boundaries.
"""

from abc import ABC, abstractmethod
from typing import Optional, List
from apps.shop.domain.entities import InventoryAggregate, ProductEntity


class IInventoryRepository(ABC):
    """Data persistence port for Inventory aggregates."""

    @abstractmethod
    def get_by_id(self, inventory_id: str, for_update: bool = False) -> Optional[InventoryAggregate]:
        """Fetch inventory aggregate by primary ID."""
        pass

    @abstractmethod
    def get_by_variant_and_warehouse(
        self, variant_id: str, warehouse_id: Optional[str] = None, for_update: bool = False
    ) -> Optional[InventoryAggregate]:
        """Fetch inventory aggregate by variant and warehouse."""
        pass

    @abstractmethod
    def save(self, inventory: InventoryAggregate) -> InventoryAggregate:
        """Persist state changes of the inventory aggregate."""
        pass

    @abstractmethod
    def delete(self, inventory_id: str) -> bool:
        """Remove inventory aggregate."""
        pass


class IProductRepository(ABC):
    """Data persistence port for Product entities."""

    @abstractmethod
    def get_by_id(self, product_id: str) -> Optional[ProductEntity]:
        pass

    @abstractmethod
    def get_by_sku(self, sku: str) -> Optional[ProductEntity]:
        pass

    @abstractmethod
    def save(self, product: ProductEntity) -> ProductEntity:
        pass
