from __future__ import annotations

from typing import Any

from core.base_models.seed_data.engine.base import BaseSeedModule
from core.base_models.seed_data.engine.context import SeedContext


class CustomerGroupSeedModule(BaseSeedModule):
    name = "customer_groups"
    section = "customers"
    depends_on = []

    def validate(self, context: SeedContext, raw_data: Any) -> list[str]:
        errors = []
        groups = raw_data.get("customer_groups", []) if isinstance(raw_data, dict) else []
        for i, g in enumerate(groups):
            if not g.get("code"):
                errors.append(f"CustomerGroup at index {i} is missing 'code'")
            if not g.get("name"):
                errors.append(f"CustomerGroup at index {i} is missing 'name'")
        return errors

    def execute(self, context: SeedContext, raw_data: Any) -> None:
        from core.base_models.system_models import SystemConfig

        groups = raw_data.get("customer_groups", []) if isinstance(raw_data, dict) else []
        if not groups:
            return

        key = "CUSTOMER_GROUPS_REGISTRY"
        config, created = SystemConfig.objects.update_or_create(
            key=key,
            defaults={
                "value": f"{len(groups)} customer group(s) configured",
                "description": "Standard B2C and B2B customer group definitions",
                "details": {"groups": groups},
            },
        )
        if created:
            context.stats.record_created()
            context.write(f"  + Customer groups registered: {len(groups)} group(s)")
        else:
            context.stats.record_updated()
            context.write(f"  * Customer groups updated: {len(groups)} group(s)")
