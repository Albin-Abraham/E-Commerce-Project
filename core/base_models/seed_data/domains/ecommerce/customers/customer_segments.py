from __future__ import annotations

from typing import Any

from core.base_models.seed_data.engine.base import BaseSeedModule
from core.base_models.seed_data.engine.context import SeedContext


class CustomerSegmentSeedModule(BaseSeedModule):
    name = "customer_segments"
    section = "customers"
    depends_on = []

    def validate(self, context: SeedContext, raw_data: Any) -> list[str]:
        errors = []
        segments = raw_data.get("customer_segments", []) if isinstance(raw_data, dict) else []
        for i, s in enumerate(segments):
            if not s.get("code"):
                errors.append(f"CustomerSegment at index {i} is missing 'code'")
            if not s.get("name"):
                errors.append(f"CustomerSegment at index {i} is missing 'name'")
        return errors

    def execute(self, context: SeedContext, raw_data: Any) -> None:
        from apps.shop.infrastructure.models.catalog import TagDefinition
        from core.base_models.system_models import SystemConfig

        segments = raw_data.get("customer_segments", []) if isinstance(raw_data, dict) else []
        for s_info in segments:
            code = s_info.get("code")
            name = s_info.get("name")
            criteria = s_info.get("criteria", "")
            if not code or not name:
                continue

            tag_def, created = TagDefinition.objects.update_or_create(
                code=f"seg_{code.lower()}",
                defaults={
                    "name": name,
                    "badge_color": "#10B981",
                    "badge_label": code,
                    "metadata": {"criteria": criteria},
                },
            )
            if created:
                context.stats.record_created()
                context.write(f"  + Customer segment created: {name} ({code})")
            else:
                context.stats.record_updated()
                context.write(f"  * Customer segment updated: {name} ({code})")

        # Also store full registry in SystemConfig
        SystemConfig.objects.update_or_create(
            key="CUSTOMER_SEGMENTS_REGISTRY",
            defaults={
                "value": f"{len(segments)} customer segment(s) configured",
                "description": "Customer behavioral segmentation rules",
                "details": {"segments": segments},
            },
        )
