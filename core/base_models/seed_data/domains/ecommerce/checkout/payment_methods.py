from __future__ import annotations

from typing import Any

from core.base_models.seed_data.engine.base import BaseSeedModule
from core.base_models.seed_data.engine.context import SeedContext


class PaymentMethodSeedModule(BaseSeedModule):
    name = "payment_methods"
    section = "checkout"
    depends_on = []

    def validate(self, context: SeedContext, raw_data: Any) -> list[str]:
        errors = []
        methods = raw_data.get("payment_methods", []) if isinstance(raw_data, dict) else []
        for i, m in enumerate(methods):
            if not m.get("code"):
                errors.append(f"PaymentMethod at index {i} is missing 'code'")
            if not m.get("name"):
                errors.append(f"PaymentMethod at index {i} is missing 'name'")
        return errors

    def execute(self, context: SeedContext, raw_data: Any) -> None:
        from core.base_models.system_models import SystemConfig

        methods = raw_data.get("payment_methods", []) if isinstance(raw_data, dict) else []
        if not methods:
            return

        config, created = SystemConfig.objects.update_or_create(
            key="PAYMENT_GATEWAYS_CONFIG",
            defaults={
                "value": f"{len(methods)} payment gateway(s) active",
                "description": "Active payment methods and gateway configurations",
                "details": {"gateways": methods},
            },
        )
        if created:
            context.stats.record_created()
            context.write(f"  + Payment methods configured: {len(methods)} gateway(s)")
        else:
            context.stats.record_updated()
            context.write(f"  * Payment methods updated: {len(methods)} gateway(s)")
