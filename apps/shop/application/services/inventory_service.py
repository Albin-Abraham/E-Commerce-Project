from uuid import UUID

from apps.shop.infrastructure.models.inventory import Inventory
from core.admin.services.base_service import BaseService


class InventoryService(BaseService[Inventory]):
    """Application service: Inventory business logic."""

    @classmethod
    def get_inventory_for_branch(cls, branch_id: UUID) -> list:
        records = cls.model.objects.filter(branch_id=branch_id)
        return [
            {
                "id": str(r.id),
                "product_id": str(r.product_id),
                "quantity": r.quantity,
                "reserved_quantity": r.reserved_quantity,
                "available": r.available_quantity,
                "is_low_stock": r.is_low_stock,
            }
            for r in records
        ]

    @classmethod
    def update_stock(cls, inventory_id: UUID, quantity_change: int, user_id: UUID = None) -> bool:
        from apps.shop.infrastructure.repository import DjangoInventoryRepository
        from core.infrastructure.uow import DjangoUnitOfWork
        from shared_domain.validation.exceptions import DomainValidationError

        repo = DjangoInventoryRepository()
        uow = DjangoUnitOfWork()

        try:
            with uow:
                aggregate = repo.get_by_id(str(inventory_id), for_update=True)
                if not aggregate:
                    return False
                new_quantity = aggregate.quantity + quantity_change
                if new_quantity < 0:
                    return False
                aggregate.adjust_stock(new_quantity)
                repo.save(aggregate)
                uow.commit()
            return True
        except DomainValidationError:
            return False

    @classmethod
    def initialize_stock(
        cls, product_id: UUID, branch_id: UUID, initial_quantity: int = 0
    ) -> Inventory:
        record, created = cls.model.objects.get_or_create(
            product_id=product_id,
            branch_id=branch_id,
            defaults={"quantity": initial_quantity},
        )
        return record

    @classmethod
    def get_low_stock_items(cls, branch_id: UUID) -> list:
        from django.db.models import F

        records = cls.model.objects.filter(
            branch_id=branch_id,
            quantity__lte=F("reorder_point"),
        )
        return [
            {"id": str(r.id), "product_id": str(r.product_id), "quantity": r.quantity}
            for r in records
        ]
