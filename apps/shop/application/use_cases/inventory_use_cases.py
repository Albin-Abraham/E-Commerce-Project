# apps/shop/application/use_cases/inventory_use_cases.py
"""
Application Use Cases for Inventory stock reservation, release, and commit operations.
Decoupled from Django ORM, HTTP request cycle, and database engines.
"""

from dataclasses import dataclass

from apps.shop.domain.repository import IInventoryRepository
from shared_domain.base.unit_of_work import IUnitOfWork
from shared_domain.validation.exceptions import DomainValidationError


@dataclass(frozen=True)
class StockActionInputDTO:
    inventory_id: str
    quantity: int


@dataclass(frozen=True)
class StockActionOutputDTO:
    inventory_id: str
    quantity: int
    available_quantity: int
    reserved_quantity: int
    success: bool


class ReserveInventoryUseCase:
    """
    Executes stock reservation on an inventory aggregate within a transactional boundary.
    """

    def __init__(self, inventory_repo: IInventoryRepository, uow: IUnitOfWork):
        self.inventory_repo = inventory_repo
        self.uow = uow

    def execute(self, dto: StockActionInputDTO) -> StockActionOutputDTO:
        with self.uow:
            inventory = self.inventory_repo.get_by_id(dto.inventory_id, for_update=True)
            if not inventory:
                raise DomainValidationError(
                    f"Inventory record '{dto.inventory_id}' not found.",
                    errors={"inventory_id": "Not found"},
                )

            inventory.reserve(dto.quantity)
            self.inventory_repo.save(inventory)
            self.uow.commit()

        return StockActionOutputDTO(
            inventory_id=dto.inventory_id,
            quantity=dto.quantity,
            available_quantity=inventory.available_quantity,
            reserved_quantity=inventory.reserved_quantity,
            success=True,
        )


class ReleaseInventoryUseCase:
    """
    Releases previously reserved stock back to available pool.
    """

    def __init__(self, inventory_repo: IInventoryRepository, uow: IUnitOfWork):
        self.inventory_repo = inventory_repo
        self.uow = uow

    def execute(self, dto: StockActionInputDTO) -> StockActionOutputDTO:
        with self.uow:
            inventory = self.inventory_repo.get_by_id(dto.inventory_id, for_update=True)
            if not inventory:
                raise DomainValidationError(
                    f"Inventory record '{dto.inventory_id}' not found.",
                    errors={"inventory_id": "Not found"},
                )

            inventory.release(dto.quantity)
            self.inventory_repo.save(inventory)
            self.uow.commit()

        return StockActionOutputDTO(
            inventory_id=dto.inventory_id,
            quantity=dto.quantity,
            available_quantity=inventory.available_quantity,
            reserved_quantity=inventory.reserved_quantity,
            success=True,
        )


class CommitInventoryUseCase:
    """
    Permanently deducts committed units from inventory upon order fulfillment.
    """

    def __init__(self, inventory_repo: IInventoryRepository, uow: IUnitOfWork):
        self.inventory_repo = inventory_repo
        self.uow = uow

    def execute(self, dto: StockActionInputDTO) -> StockActionOutputDTO:
        with self.uow:
            inventory = self.inventory_repo.get_by_id(dto.inventory_id, for_update=True)
            if not inventory:
                raise DomainValidationError(
                    f"Inventory record '{dto.inventory_id}' not found.",
                    errors={"inventory_id": "Not found"},
                )

            inventory.commit(dto.quantity)
            self.inventory_repo.save(inventory)
            self.uow.commit()

        return StockActionOutputDTO(
            inventory_id=dto.inventory_id,
            quantity=dto.quantity,
            available_quantity=inventory.available_quantity,
            reserved_quantity=inventory.reserved_quantity,
            success=True,
        )
