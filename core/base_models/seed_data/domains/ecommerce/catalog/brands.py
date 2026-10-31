from __future__ import annotations

from typing import Any

from core.base_models.seed_data.engine.base import BaseSeedModule
from core.base_models.seed_data.engine.context import SeedContext


class BrandSeedModule(BaseSeedModule):
    name = "brands"
    section = "catalog"
    depends_on = []

    def validate(self, context: SeedContext, raw_data: Any) -> list[str]:
        errors = []
        brands_data = raw_data.get("brands", []) if isinstance(raw_data, dict) else []
        for i, b in enumerate(brands_data):
            if not b.get("name"):
                errors.append(f"Brand at index {i} is missing required 'name'")
            if not b.get("slug"):
                errors.append(f"Brand at index {i} is missing required 'slug'")
        return errors

    def execute(self, context: SeedContext, raw_data: Any) -> None:
        from apps.shop.infrastructure.models.brand import Brand

        brands_data = raw_data.get("brands", []) if isinstance(raw_data, dict) else []
        for b_info in brands_data:
            name = b_info.get("name")
            slug = b_info.get("slug")
            if not name or not slug:
                continue

            brand, created = Brand.objects.update_or_create(
                slug=slug,
                defaults={
                    "name": name,
                    "description": b_info.get("description", ""),
                    "website": b_info.get("website"),
                    "is_active": b_info.get("is_active", True),
                    "metadata": b_info.get("metadata", {}),
                },
            )
            if created:
                context.stats.record_created()
                context.write(f"  + Brand created: {name} ({slug})")
            else:
                context.stats.record_updated()
                context.write(f"  * Brand updated: {name} ({slug})")
