# apps/shop/domain/entities.py
"""
Domain Aggregates and Entities for Shop & Inventory.
Pure Python, framework agnostic. Enforces domain invariants.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from decimal import Decimal
from typing import Optional
from shared_domain.base.aggregate import AggregateRoot
from shared_domain.validation.exceptions import DomainValidationError
from apps.shop.domain.events import (
    InventoryStockReserved,
    InventoryStockReleased,
    InventoryStockCommitted,
)


@dataclass
class InventoryAggregate(AggregateRoot):
    """
    Aggregate Root for Inventory stock tracking across variants and warehouses.
    Guarantees stock integrity and manages reservations.
    """
    product_id: str = ""
    variant_id: Optional[str] = None
    warehouse_id: Optional[str] = None
    branch_id: Optional[str] = None
    quantity: int = 0
    reserved_quantity: int = 0
    reorder_point: int = 10
    unit_cost: Decimal = field(default_factory=lambda: Decimal("0.00"))

    @property
    def available_quantity(self) -> int:
        """Units actually available for sale or allocation."""
        return self.quantity - self.reserved_quantity

    @property
    def is_low_stock(self) -> bool:
        """Determines if current available quantity is at or below the reorder point."""
        return self.available_quantity <= self.reorder_point

    def reserve(self, qty: int) -> None:
        """
        Reserve stock for a pending order or transfer.
        Enforces invariant: qty must be positive and available_quantity >= qty.
        """
        if qty <= 0:
            raise DomainValidationError("Reservation quantity must be positive.", errors={"quantity": "Must be > 0"})
        if self.available_quantity < qty:
            raise DomainValidationError(
                f"Insufficient stock for inventory {self.id}. Requested: {qty}, Available: {self.available_quantity}",
                errors={"quantity": f"Requested {qty} exceeds available {self.available_quantity}"}
            )

        self.reserved_quantity += qty
        self.record_event(
            InventoryStockReserved(
                aggregate_id=self.id or "",
                aggregate_type="Inventory",
                inventory_id=self.id or "",
                quantity=qty,
            )
        )

    def release(self, qty: int) -> None:
        """
        Release previously reserved stock back to available pool.
        """
        if qty <= 0:
            return
        if self.reserved_quantity < qty:
            raise DomainValidationError(
                f"Cannot release {qty} units: only {self.reserved_quantity} units are reserved.",
                errors={"quantity": f"Release {qty} exceeds reserved {self.reserved_quantity}"}
            )

        self.reserved_quantity -= qty
        self.record_event(
            InventoryStockReleased(
                aggregate_id=self.id or "",
                aggregate_type="Inventory",
                inventory_id=self.id or "",
                quantity=qty,
            )
        )

    def commit(self, qty: int) -> None:
        """
        Permanently commit and fulfill reserved stock (deducted from physical inventory).
        """
        if qty <= 0:
            return
        if self.reserved_quantity < qty or self.quantity < qty:
            raise DomainValidationError(
                f"Cannot commit {qty} units: insufficient physical ({self.quantity}) or reserved ({self.reserved_quantity}) stock.",
                errors={"quantity": "Commit exceeds physical or reserved stock"}
            )

        self.quantity -= qty
        self.reserved_quantity -= qty
        self.record_event(
            InventoryStockCommitted(
                aggregate_id=self.id or "",
                aggregate_type="Inventory",
                inventory_id=self.id or "",
                quantity=qty,
            )
        )

    def adjust_stock(self, new_quantity: int) -> None:
        """Physically adjust stock count after cycle count / reconciliation."""
        if new_quantity < self.reserved_quantity:
            raise DomainValidationError(
                f"Adjusted quantity {new_quantity} cannot be lower than already reserved units {self.reserved_quantity}.",
                errors={"quantity": "Cannot be lower than reserved units"}
            )
        self.quantity = new_quantity


@dataclass
class ProductEntity(AggregateRoot):
    """
    Domain entity for Product in the catalog.
    """
    name: str = ""
    sku: str = ""
    price: Decimal = field(default_factory=lambda: Decimal("0.00"))
    is_active: bool = True
    category_id: Optional[str] = None
    brand_id: Optional[str] = None

    def validate_price(self) -> None:
        if self.price < Decimal("0.00"):
            raise DomainValidationError("Product price cannot be negative.", errors={"price": "Must be >= 0"})
