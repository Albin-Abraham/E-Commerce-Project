from __future__ import annotations

from typing import Any

from core.base_models.seed_data.engine.base import BaseSeedModule
from core.base_models.seed_data.engine.context import SeedContext


class OrderStatusSeedModule(BaseSeedModule):
    name = "order_statuses"
    section = "orders"
    depends_on = []

    def validate(self, context: SeedContext, raw_data: Any) -> list[str]:
        errors = []
        statuses = raw_data.get("order_statuses", []) if isinstance(raw_data, dict) else []
        for i, s in enumerate(statuses):
            if not s.get("code"):
                errors.append(f"OrderStatus at index {i} is missing 'code'")
            if not s.get("label"):
                errors.append(f"OrderStatus at index {i} is missing 'label'")
        return errors

    def execute(self, context: SeedContext, raw_data: Any) -> None:
        from core.base_models.system_models import SystemConfig

        statuses = raw_data.get("order_statuses", []) if isinstance(raw_data, dict) else []
        if not statuses:
            return

        config, created = SystemConfig.objects.update_or_create(
            key="ORDER_STATUSES_CONFIG",
            defaults={
                "value": f"{len(statuses)} order status(es) defined",
                "description": "Order lifecycle statuses and allowed state transitions",
                "details": {"statuses": statuses},
            },
        )
        if created:
            context.stats.record_created()
            context.write(f"  + Order statuses configured: {len(statuses)} status(es)")
        else:
            context.stats.record_updated()
            context.write(f"  * Order statuses updated: {len(statuses)} status(es)")
