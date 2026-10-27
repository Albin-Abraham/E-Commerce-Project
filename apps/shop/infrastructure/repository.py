# apps/shop/infrastructure/repository.py
"""
Django ORM Repository implementations for the Shop domain.
Encapsulates all SQL and database queries for Inventory and Product aggregates.
"""

from apps.shop.domain.entities import InventoryAggregate, ProductEntity
from apps.shop.domain.repository import IInventoryRepository, IProductRepository
from apps.shop.infrastructure.mappers import InventoryDataMapper, ProductDataMapper
from apps.shop.infrastructure.models.inventory import Inventory
from apps.shop.infrastructure.models.product import Product


class DjangoInventoryRepository(IInventoryRepository):
    """
    Concrete Django ORM repository for Inventory aggregates.
    """

    def get_by_id(self, inventory_id: str, for_update: bool = False) -> InventoryAggregate | None:
        qs = Inventory.objects.select_for_update() if for_update else Inventory.objects
        model = qs.filter(id=inventory_id).first()
        return InventoryDataMapper.to_domain(model) if model else None

    def get_by_variant_and_warehouse(
        self, variant_id: str, warehouse_id: str | None = None, for_update: bool = False
    ) -> InventoryAggregate | None:
        qs = Inventory.objects.select_for_update() if for_update else Inventory.objects
        qs = qs.filter(variant_id=variant_id)
        if warehouse_id:
            qs = qs.filter(warehouse_id=warehouse_id)
        model = qs.first()
        return InventoryDataMapper.to_domain(model) if model else None

    def get_by_product_and_branch(
        self, product_id: str, branch_id: str | None = None, for_update: bool = False
    ) -> InventoryAggregate | None:
        qs = Inventory.objects.select_for_update() if for_update else Inventory.objects
        qs = qs.filter(product_id=product_id)
        if branch_id:
            qs = qs.filter(branch_id=branch_id)
        model = qs.first()
        return InventoryDataMapper.to_domain(model) if model else None

    def save(self, inventory: InventoryAggregate) -> InventoryAggregate:
        existing = Inventory.objects.filter(id=inventory.id).first() if inventory.id else None
        model = InventoryDataMapper.to_orm(inventory, existing)
        if existing:
            # Atomic field update for concurrency safety
            Inventory.objects.filter(id=inventory.id).update(
                quantity=inventory.quantity,
                reserved_quantity=inventory.reserved_quantity,
                reorder_point=inventory.reorder_point,
                unit_cost=inventory.unit_cost,
            )
        else:
            model.save()
            inventory.id = str(model.id)
        return inventory

    def delete(self, inventory_id: str) -> bool:
        deleted_count, _ = Inventory.objects.filter(id=inventory_id).delete()
        return deleted_count > 0


class DjangoProductRepository(IProductRepository):
    """
    Concrete Django ORM repository for Product entities.
    """

    def get_by_id(self, product_id: str) -> ProductEntity | None:
        model = Product.objects.filter(id=product_id).first()
        return ProductDataMapper.to_domain(model) if model else None

    def get_by_sku(self, sku: str) -> ProductEntity | None:
        model = Product.objects.filter(sku=sku).first()
        return ProductDataMapper.to_domain(model) if model else None

    def save(self, product: ProductEntity) -> ProductEntity:
        existing = Product.objects.filter(id=product.id).first() if product.id else None
        model = ProductDataMapper.to_orm(product, existing)
        model.save()
        product.id = str(model.id)
        return product
