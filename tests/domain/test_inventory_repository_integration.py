# tests/domain/test_inventory_repository_integration.py
"""
Integration Tests for DjangoInventoryRepository, InventoryDataMapper, and DjangoUnitOfWork.
Verifies the persistence adapter correctly synchronizes InventoryAggregate with Django ORM.
"""

import pytest

from apps.shop.infrastructure.models.inventory import Inventory
from apps.shop.infrastructure.repository import DjangoInventoryRepository
from apps.shop.workflows.inventory_reservation_workflow import InventoryReservationWorkflow


@pytest.mark.django_db
class TestDjangoInventoryRepositoryIntegration:
    """Tests the Infrastructure Repository Adapter with Django DB."""

    def test_save_and_retrieve_inventory_aggregate(self):
        inv_model = Inventory.objects.create(
            quantity=100,
            reserved_quantity=20,
        )

        repo = DjangoInventoryRepository()
        aggregate = repo.get_by_id(str(inv_model.id))
        assert aggregate is not None
        assert aggregate.quantity == 100
        assert aggregate.reserved_quantity == 20
        assert aggregate.available_quantity == 80

        # Mutate aggregate and persist
        aggregate.reserve(30)
        repo.save(aggregate)

        # Refresh from DB
        inv_model.refresh_from_db()
        assert inv_model.reserved_quantity == 50
        assert inv_model.quantity == 100

    def test_reserve_and_commit_via_workflow_facade(self):
        inv_model = Inventory.objects.create(
            quantity=50,
            reserved_quantity=0,
        )

        # Reserve 15 units
        assert InventoryReservationWorkflow.reserve(str(inv_model.id), 15) is True
        inv_model.refresh_from_db()
        assert inv_model.reserved_quantity == 15

        # Release 5 units
        assert InventoryReservationWorkflow.release(str(inv_model.id), 5) is True
        inv_model.refresh_from_db()
        assert inv_model.reserved_quantity == 10

        # Commit 10 units
        assert InventoryReservationWorkflow.commit(str(inv_model.id), 10) is True
        inv_model.refresh_from_db()
        assert inv_model.quantity == 40
        assert inv_model.reserved_quantity == 0
