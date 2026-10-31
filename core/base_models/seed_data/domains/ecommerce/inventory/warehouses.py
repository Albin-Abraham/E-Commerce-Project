from __future__ import annotations

from typing import Any

from core.base_models.seed_data.engine.base import BaseSeedModule
from core.base_models.seed_data.engine.context import SeedContext


class WarehouseSeedModule(BaseSeedModule):
    name = "warehouses"
    section = "inventory"
    depends_on = []

    def validate(self, context: SeedContext, raw_data: Any) -> list[str]:
        errors = []
        warehouses = raw_data.get("warehouses", []) if isinstance(raw_data, dict) else []
        for i, w in enumerate(warehouses):
            if not w.get("code"):
                errors.append(f"Warehouse at index {i} is missing required 'code'")
            if not w.get("name"):
                errors.append(f"Warehouse at index {i} is missing required 'name'")
        return errors

    def execute(self, context: SeedContext, raw_data: Any) -> None:
        from apps.shop.infrastructure.models.facility import Facility
        from apps.shop.infrastructure.models.warehouse import Warehouse
        from core.admin.models.company import Company

        warehouses = raw_data.get("warehouses", []) if isinstance(raw_data, dict) else []
        target_company = context.company or Company.objects.first()

        for w_info in warehouses:
            code = w_info.get("code")
            name = w_info.get("name")
            if not code or not name:
                continue

            wh, created = Warehouse.objects.update_or_create(
                code=code,
                defaults={
                    "name": name,
                    "address": w_info.get("address", ""),
                    "is_active": w_info.get("is_active", True),
                    "company": target_company,
                },
            )

            # Ensure corresponding Facility exists for advanced fulfillment routing
            if target_company:
                Facility.objects.update_or_create(
                    facility_code=code,
                    company=target_company,
                    defaults={
                        "name": name,
                        "facility_type": "WAREHOUSE",
                        "address": w_info.get("address", ""),
                        "is_active": w_info.get("is_active", True),
                    },
                )

            if created:
                context.stats.record_created()
                context.write(f"  + Warehouse created: {name} ({code})")
            else:
                context.stats.record_updated()
                context.write(f"  * Warehouse updated: {name} ({code})")
