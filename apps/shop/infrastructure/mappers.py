# apps/shop/infrastructure/mappers.py
"""
Data Mappers for Shop domain entities and aggregates.
Handles bidirectional translation between pure Python domain objects and Django ORM models.
"""

from decimal import Decimal
from typing import Optional
from apps.shop.domain.entities import InventoryAggregate, ProductEntity
from apps.shop.infrastructure.models.inventory import Inventory
from apps.shop.infrastructure.models.product import Product


class InventoryDataMapper:
    """Translates between InventoryAggregate and Django Inventory model."""

    @staticmethod
    def to_domain(model: Inventory) -> InventoryAggregate:
        return InventoryAggregate(
            id=str(model.id),
            product_id=str(model.product_id) if model.product_id else "",
            variant_id=str(model.variant_id) if model.variant_id else None,
            warehouse_id=str(model.warehouse_id) if model.warehouse_id else None,
            branch_id=str(model.branch_id) if model.branch_id else None,
            quantity=model.quantity,
            reserved_quantity=model.reserved_quantity,
            reorder_point=model.reorder_point,
            unit_cost=Decimal(str(model.unit_cost or 0)),
        )

    @staticmethod
    def to_orm(entity: InventoryAggregate, existing_model: Optional[Inventory] = None) -> Inventory:
        model = existing_model or Inventory()
        if entity.id:
            model.id = entity.id
        if entity.product_id:
            model.product_id = entity.product_id
        if entity.variant_id:
            model.variant_id = entity.variant_id
        if entity.warehouse_id:
            model.warehouse_id = entity.warehouse_id
        if entity.branch_id:
            model.branch_id = entity.branch_id

        model.quantity = entity.quantity
        model.reserved_quantity = entity.reserved_quantity
        model.reorder_point = entity.reorder_point
        model.unit_cost = entity.unit_cost
        return model


class ProductDataMapper:
    """Translates between ProductEntity and Django Product model."""

    @staticmethod
    def to_domain(model: Product) -> ProductEntity:
        return ProductEntity(
            id=str(model.id),
            name=model.name,
            sku=model.sku or "",
            price=Decimal(str(model.price or 0)),
            is_active=model.is_active,
            category_id=str(model.category_id) if model.category_id else None,
            brand_id=str(model.brand_id) if model.brand_id else None,
        )

    @staticmethod
    def to_orm(entity: ProductEntity, existing_model: Optional[Product] = None) -> Product:
        model = existing_model or Product()
        if entity.id:
            model.id = entity.id
        model.name = entity.name
        model.sku = entity.sku
        model.price = entity.price
        model.is_active = entity.is_active
        if entity.category_id:
            model.category_id = entity.category_id
        if entity.brand_id:
            model.brand_id = entity.brand_id
        return model
