from __future__ import annotations

from typing import Any

from core.base_models.seed_data.engine.base import BaseSeedModule
from core.base_models.seed_data.engine.context import SeedContext


class AttributeSeedModule(BaseSeedModule):
    name = "attributes"
    section = "catalog"
    depends_on = []

    def validate(self, context: SeedContext, raw_data: Any) -> list[str]:
        errors = []
        attributes = raw_data.get("attributes", []) if isinstance(raw_data, dict) else []
        for i, a in enumerate(attributes):
            if not a.get("name"):
                errors.append(f"Attribute at index {i} is missing required 'name'")
            if not a.get("code"):
                errors.append(f"Attribute at index {i} is missing required 'code'")
        return errors

    def execute(self, context: SeedContext, raw_data: Any) -> None:
        from apps.shop.infrastructure.models.catalog import TagDefinition

        attributes = raw_data.get("attributes", []) if isinstance(raw_data, dict) else []
        for a_info in attributes:
            name = a_info.get("name")
            code = a_info.get("code")
            if not name or not code:
                continue

            tag_def, created = TagDefinition.objects.update_or_create(
                code=f"attr_{code.lower()}",
                defaults={
                    "name": name,
                    "badge_color": "#3B82F6",
                    "badge_label": code,
                    "metadata": {
                        "type": a_info.get("input_type", "select"),
                        "allowed_values": a_info.get("values", []),
                    },
                },
            )
            if created:
                context.stats.record_created()
                context.write(f"  + Attribute tag defined: {code} ({name})")
            else:
                context.stats.record_updated()
                context.write(f"  * Attribute tag updated: {code} ({name})")
