# apps/shop/workflows/inventory_reservation_workflow.py
import logging

from apps.shop.application.use_cases.inventory_use_cases import (
    CommitInventoryUseCase,
    ReleaseInventoryUseCase,
    ReserveInventoryUseCase,
    StockActionInputDTO,
)
from apps.shop.infrastructure.repository import DjangoInventoryRepository
from core.infrastructure.uow import DjangoUnitOfWork

logger = logging.getLogger(__name__)


class InventoryReservationWorkflow:
    """
    Atomic Stock Reservation, Release, and Commit Lifecycle Workflow Engine.
    Orchestrates application use cases backed by Clean Architecture repositories.
    """

    @classmethod
    def reserve(cls, inventory_id: str, qty: int) -> bool:
        repo = DjangoInventoryRepository()
        uow = DjangoUnitOfWork()
        use_case = ReserveInventoryUseCase(repo, uow)
        res = use_case.execute(StockActionInputDTO(inventory_id=str(inventory_id), quantity=qty))
        if res.success:
            logger.info(f"Reserved {qty} units on Inventory {inventory_id}")
        return res.success

    @classmethod
    def release(cls, inventory_id: str, qty: int) -> bool:
        repo = DjangoInventoryRepository()
        uow = DjangoUnitOfWork()
        use_case = ReleaseInventoryUseCase(repo, uow)
        res = use_case.execute(StockActionInputDTO(inventory_id=str(inventory_id), quantity=qty))
        if res.success:
            logger.info(f"Released {qty} reserved units on Inventory {inventory_id}")
        return res.success

    @classmethod
    def commit(cls, inventory_id: str, qty: int) -> bool:
        repo = DjangoInventoryRepository()
        uow = DjangoUnitOfWork()
        use_case = CommitInventoryUseCase(repo, uow)
        res = use_case.execute(StockActionInputDTO(inventory_id=str(inventory_id), quantity=qty))
        if res.success:
            logger.info(f"Committed {qty} units on Inventory {inventory_id}")
        return res.success
