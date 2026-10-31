from __future__ import annotations

from typing import Any

from core.base_models.seed_data.engine.base import BaseSeedModule
from core.base_models.seed_data.engine.context import SeedContext


class CancellationReasonSeedModule(BaseSeedModule):
    name = "cancellation_reasons"
    section = "orders"
    depends_on = []

    def validate(self, context: SeedContext, raw_data: Any) -> list[str]:
        errors = []
        reasons = raw_data.get("cancellation_reasons", []) if isinstance(raw_data, dict) else []
        for i, r in enumerate(reasons):
            if not r.get("code"):
                errors.append(f"CancellationReason at index {i} is missing 'code'")
            if not r.get("reason"):
                errors.append(f"CancellationReason at index {i} is missing 'reason'")
        return errors

    def execute(self, context: SeedContext, raw_data: Any) -> None:
        from core.base_models.system_models import SystemConfig

        reasons = raw_data.get("cancellation_reasons", []) if isinstance(raw_data, dict) else []
        if not reasons:
            return

        config, created = SystemConfig.objects.update_or_create(
            key="ORDER_CANCELLATION_REASONS_CONFIG",
            defaults={
                "value": f"{len(reasons)} cancellation reason(s) defined",
                "description": "Standard cancellation reason codes and approval policies",
                "details": {"reasons": reasons},
            },
        )
        if created:
            context.stats.record_created()
            context.write(f"  + Cancellation reasons configured: {len(reasons)} reason(s)")
        else:
            context.stats.record_updated()
            context.write(f"  * Cancellation reasons updated: {len(reasons)} reason(s)")
