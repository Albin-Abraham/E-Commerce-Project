from typing import Dict, Any, Optional
from uuid import UUID
from django.db import transaction
from core.admin.services.base_service import BaseService
from core.admin.utils.integrity.retry import retry_on_conflict
from apps.shop.infrastructure.models.inventory import Inventory


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
    @retry_on_conflict(max_retries=3)
    @transaction.atomic
    def update_stock(cls, inventory_id: UUID, quantity_change: int, user_id: UUID = None) -> bool:
        record = cls.get_object(inventory_id)
        if not record:
            return False

        new_quantity = record.quantity + quantity_change
        if new_quantity < 0:
            return False

        record.quantity = new_quantity
        record.save()
        return True

    @classmethod
    def initialize_stock(cls, product_id: UUID, branch_id: UUID, initial_quantity: int = 0) -> Inventory:
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
