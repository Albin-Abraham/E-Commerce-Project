# tests/domain/test_inventory_domain.py
"""
Pure Domain and Application Use Case Unit Tests for Inventory & Shop.
Runs in-memory with zero framework or database dependencies (under 0.1s).
"""

import pytest
from typing import Optional, Dict
from apps.shop.domain.entities import InventoryAggregate, ProductEntity
from apps.shop.domain.repository import IInventoryRepository
from apps.shop.application.use_cases.inventory_use_cases import (
    ReserveInventoryUseCase,
    ReleaseInventoryUseCase,
    CommitInventoryUseCase,
    StockActionInputDTO,
)
from shared_domain.base.unit_of_work import IUnitOfWork
from shared_domain.validation.exceptions import DomainValidationError


class InMemoryUnitOfWork(IUnitOfWork):
    def __init__(self):
        self.committed = False
        self.rolled_back = False

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            self.rolled_back = True

    def commit(self):
        self.committed = True

    def rollback(self):
        self.rolled_back = True


class InMemoryInventoryRepository(IInventoryRepository):
    def __init__(self):
        self._storage: Dict[str, InventoryAggregate] = {}
        self._id_counter = 1

    def get_by_id(self, inventory_id: str, for_update: bool = False) -> Optional[InventoryAggregate]:
        return self._storage.get(inventory_id)

    def get_by_variant_and_warehouse(
        self, variant_id: str, warehouse_id: Optional[str] = None, for_update: bool = False
    ) -> Optional[InventoryAggregate]:
        for inv in self._storage.values():
            if inv.variant_id == variant_id:
                if warehouse_id is None or inv.warehouse_id == warehouse_id:
                    return inv
        return None

    def save(self, inventory: InventoryAggregate) -> InventoryAggregate:
        if not inventory.id:
            inventory.id = f"inv_{self._id_counter}"
            self._id_counter += 1
        self._storage[inventory.id] = inventory
        return inventory

    def delete(self, inventory_id: str) -> bool:
        return self._storage.pop(inventory_id, None) is not None


class TestInventoryAggregateDomain:
    """Domain Invariant Enforcement Tests (Zero DB)."""

    def test_initial_state_and_available_quantity(self):
        inv = InventoryAggregate(id="inv_1", product_id="prod_1", quantity=100, reserved_quantity=20)
        assert inv.available_quantity == 80
        assert inv.is_low_stock is False

    def test_reserve_stock_success_records_domain_event(self):
        inv = InventoryAggregate(id="inv_1", product_id="prod_1", quantity=50, reserved_quantity=10)
        inv.reserve(20)

        assert inv.reserved_quantity == 30
        assert inv.available_quantity == 20

        events = inv.pull_events()
        assert len(events) == 1
        assert events[0].event_name == "shop.inventory.stock_reserved"
        assert events[0].quantity == 20

    def test_reserve_exceeding_available_raises_invariant_error(self):
        inv = InventoryAggregate(id="inv_1", product_id="prod_1", quantity=20, reserved_quantity=15)
        # only 5 available
        with pytest.raises(DomainValidationError) as exc:
            inv.reserve(10)
        assert "Insufficient stock" in str(exc.value)

    def test_reserve_negative_or_zero_raises_invariant_error(self):
        inv = InventoryAggregate(id="inv_1", product_id="prod_1", quantity=20)
        with pytest.raises(DomainValidationError):
            inv.reserve(0)
        with pytest.raises(DomainValidationError):
            inv.reserve(-5)

    def test_release_stock_success_records_domain_event(self):
        inv = InventoryAggregate(id="inv_1", product_id="prod_1", quantity=50, reserved_quantity=30)
        inv.release(10)
        assert inv.reserved_quantity == 20
        assert inv.available_quantity == 30

        events = inv.pull_events()
        assert len(events) == 1
        assert events[0].event_name == "shop.inventory.stock_released"

    def test_release_more_than_reserved_raises_invariant_error(self):
        inv = InventoryAggregate(id="inv_1", product_id="prod_1", quantity=50, reserved_quantity=10)
        with pytest.raises(DomainValidationError) as exc:
            inv.release(15)
        assert "Cannot release" in str(exc.value)

    def test_commit_stock_deducts_physical_and_reserved_stock(self):
        inv = InventoryAggregate(id="inv_1", product_id="prod_1", quantity=100, reserved_quantity=40)
        inv.commit(30)
        assert inv.quantity == 70
        assert inv.reserved_quantity == 10
        assert inv.available_quantity == 60

        events = inv.pull_events()
        assert len(events) == 1
        assert events[0].event_name == "shop.inventory.stock_committed"

    def test_commit_unreserved_units_raises_invariant_error(self):
        inv = InventoryAggregate(id="inv_1", product_id="prod_1", quantity=100, reserved_quantity=10)
        with pytest.raises(DomainValidationError) as exc:
            inv.commit(25)
        assert "Cannot commit" in str(exc.value)


class TestInventoryUseCases:
    """Application Use Case Tests (Mock Repositories & In-Memory UoW)."""

    def test_reserve_inventory_use_case_success(self):
        repo = InMemoryInventoryRepository()
        uow = InMemoryUnitOfWork()
        inv = repo.save(InventoryAggregate(product_id="p1", quantity=50, reserved_quantity=0))

        use_case = ReserveInventoryUseCase(repo, uow)
        result = use_case.execute(StockActionInputDTO(inventory_id=inv.id, quantity=15))

        assert result.success is True
        assert result.reserved_quantity == 15
        assert result.available_quantity == 35
        assert uow.committed is True

    def test_reserve_inventory_not_found_raises_domain_error(self):
        repo = InMemoryInventoryRepository()
        uow = InMemoryUnitOfWork()
        use_case = ReserveInventoryUseCase(repo, uow)

        with pytest.raises(DomainValidationError) as exc:
            use_case.execute(StockActionInputDTO(inventory_id="nonexistent", quantity=5))
        assert "not found" in str(exc.value)
        assert uow.committed is False

    def test_commit_inventory_use_case_success(self):
        repo = InMemoryInventoryRepository()
        uow = InMemoryUnitOfWork()
        inv = repo.save(InventoryAggregate(product_id="p1", quantity=50, reserved_quantity=20))

        use_case = CommitInventoryUseCase(repo, uow)
        result = use_case.execute(StockActionInputDTO(inventory_id=inv.id, quantity=15))

        assert result.success is True
        assert result.reserved_quantity == 5
        assert result.available_quantity == 30
        assert uow.committed is True
