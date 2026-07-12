from typing import Dict, Any, List
from uuid import UUID
from django.db import transaction
from core.admin.services.base_service import BaseService
from core.admin.helpers.mediator_helpers import ValidationMediator
from apps.shop.infrastructure.models.product import Product
from apps.shop.infrastructure.models.inventory import Inventory
from apps.shop.application.interfaces.product_interface import IProductService


class ProductService(BaseService[Product], IProductService):
    """Application service: Product business logic."""

    @classmethod
    def get_product_summary(cls, product_id: UUID) -> Dict[str, Any]:
        product = cls.get_object(product_id)
        if not product:
            return {}
        return {
            "id": str(product.id),
            "name": product.name,
            "sku": product.sku,
            "price": str(product.price),
            "is_active": product.is_active,
        }

    @classmethod
    def check_stock(cls, product_id: UUID, branch_id: UUID) -> bool:
        return Inventory.objects.filter(
            product_id=product_id,
            branch_id=branch_id,
            quantity__gt=0,
        ).exists()

    @classmethod
    def validate_availability(cls, product_id: UUID, quantity: int, branch_id: UUID) -> bool:
        inventory = Inventory.objects.filter(
            product_id=product_id,
            branch_id=branch_id,
        ).first()
        if not inventory:
            return False
        return inventory.available_quantity >= quantity

    @classmethod
    def get_products_for_branch(cls, branch_id: UUID) -> List[Dict[str, Any]]:
        products = cls.model.objects.filter(
            branch_id=branch_id,
            is_active=True,
        )
        return [
            {"id": str(p.id), "name": p.name, "sku": p.sku, "price": str(p.price)}
            for p in products
        ]
