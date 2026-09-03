import logging
from django.db import transaction
from apps.shop.infrastructure.models.inventory import Inventory

logger = logging.getLogger(__name__)


class InventoryReservationWorkflow:
    """
    Atomic Stock Reservation, Release, and Commit Lifecycle Workflow Engine.
    """

    @classmethod
    @transaction.atomic
    def reserve(cls, inventory_id: str, qty: int) -> bool:
        success = Inventory.reserve_stock(inventory_id, qty)
        if success:
            logger.info(f"Reserved {qty} units on Inventory {inventory_id}")
        return success

    @classmethod
    @transaction.atomic
    def release(cls, inventory_id: str, qty: int) -> bool:
        success = Inventory.release_stock(inventory_id, qty)
        if success:
            logger.info(f"Released {qty} reserved units on Inventory {inventory_id}")
        return success

    @classmethod
    @transaction.atomic
    def commit(cls, inventory_id: str, qty: int) -> bool:
        success = Inventory.commit_stock(inventory_id, qty)
        if success:
            logger.info(f"Committed {qty} units on Inventory {inventory_id}")
        return success
