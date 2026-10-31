from __future__ import annotations

from typing import Any

from core.base_models.seed_data.engine.base import BaseSeedModule
from core.base_models.seed_data.engine.context import SeedContext


class StockSeedModule(BaseSeedModule):
    name = "stock"
    section = "inventory"
    depends_on = ["product_variants", "warehouses"]

    def validate(self, context: SeedContext, raw_data: Any) -> list[str]:
        errors = []
        stock_list = raw_data.get("stock", []) if isinstance(raw_data, dict) else []
        for i, s in enumerate(stock_list):
            if not s.get("variant_sku"):
                errors.append(f"Stock entry at index {i} is missing 'variant_sku'")
            if not s.get("warehouse_code"):
                errors.append(f"Stock entry at index {i} is missing 'warehouse_code'")
        return errors

    def execute(self, context: SeedContext, raw_data: Any) -> None:
        from apps.shop.infrastructure.models.inventory import Inventory
        from apps.shop.infrastructure.models.variant import ProductVariant
        from apps.shop.infrastructure.models.warehouse import Warehouse

        stock_list = raw_data.get("stock", []) if isinstance(raw_data, dict) else []
        for s_info in stock_list:
            v_sku = s_info.get("variant_sku")
            wh_code = s_info.get("warehouse_code")
            if not v_sku or not wh_code:
                continue

            variant = ProductVariant.objects.filter(sku=v_sku).first()
            warehouse = Warehouse.objects.filter(code=wh_code).first()

            if not variant or not warehouse:
                context.stats.record_skipped()
                context.write(f"  ! Skipped stock for {v_sku} @ {wh_code}: entity not found")
                continue

            inv_record = Inventory.objects.filter(
                variant=variant,
                warehouse=warehouse,
                branch=None,
                batch=None,
            ).first()

            qty = s_info.get("quantity", 0)
            res_qty = s_info.get("reserved_quantity", 0)
            reorder = s_info.get("reorder_point", 10)
            unit_cost = s_info.get("unit_cost", 0.0)

            if inv_record:
                inv_record.quantity = qty
                inv_record.reserved_quantity = res_qty
                inv_record.reorder_point = reorder
                inv_record.unit_cost = unit_cost
                inv_record.save()
                context.stats.record_updated()
                context.write(f"  * Stock updated for {v_sku} @ {wh_code}: Qty {qty}")
            else:
                Inventory.objects.create(
                    variant=variant,
                    product=variant.product,
                    warehouse=warehouse,
                    quantity=qty,
                    reserved_quantity=res_qty,
                    reorder_point=reorder,
                    unit_cost=unit_cost,
                )
                context.stats.record_created()
                context.write(f"  + Stock created for {v_sku} @ {wh_code}: Qty {qty}")
