from __future__ import annotations

from typing import Any

from core.base_models.seed_data.engine.base import BaseSeedModule
from core.base_models.seed_data.engine.context import SeedContext


class PriceListSeedModule(BaseSeedModule):
    name = "price_lists"
    section = "pricing"
    depends_on = []

    def validate(self, context: SeedContext, raw_data: Any) -> list[str]:
        errors = []
        lists = raw_data.get("price_lists", []) if isinstance(raw_data, dict) else []
        for i, pl in enumerate(lists):
            if not pl.get("code"):
                errors.append(f"PriceList at index {i} is missing required 'code'")
            if not pl.get("name"):
                errors.append(f"PriceList at index {i} is missing required 'name'")
        return errors

    def execute(self, context: SeedContext, raw_data: Any) -> None:
        from apps.shop.infrastructure.models.pricing import PriceList
        from core.admin.models.company import Company

        lists = raw_data.get("price_lists", []) if isinstance(raw_data, dict) else []
        target_company = context.company or Company.objects.first()

        for pl_info in lists:
            code = pl_info.get("code")
            name = pl_info.get("name")
            if not code or not name:
                continue

            pl, created = PriceList.objects.update_or_create(
                code=code,
                defaults={
                    "name": name,
                    "is_active": pl_info.get("is_active", True),
                    "company": target_company,
                },
            )
            if created:
                context.stats.record_created()
                context.write(f"  + PriceList created: {name} ({code})")
            else:
                context.stats.record_updated()
                context.write(f"  * PriceList updated: {name} ({code})")
