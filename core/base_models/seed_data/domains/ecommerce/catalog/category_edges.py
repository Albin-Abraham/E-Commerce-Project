from __future__ import annotations

from typing import Any

from core.base_models.seed_data.engine.base import BaseSeedModule
from core.base_models.seed_data.engine.context import SeedContext


class CategoryEdgeSeedModule(BaseSeedModule):
    name = "category_edges"
    section = "catalog"
    depends_on = ["categories"]

    def validate(self, context: SeedContext, raw_data: Any) -> list[str]:
        errors = []
        edges = raw_data.get("category_edges", []) if isinstance(raw_data, dict) else []
        for i, edge in enumerate(edges):
            if not edge.get("from_category"):
                errors.append(f"CategoryEdge at index {i} is missing 'from_category'")
            if not edge.get("to_category"):
                errors.append(f"CategoryEdge at index {i} is missing 'to_category'")
        return errors

    def execute(self, context: SeedContext, raw_data: Any) -> None:
        from apps.shop.infrastructure.models.category import Category, CategoryEdge

        edges = raw_data.get("category_edges", []) if isinstance(raw_data, dict) else []
        for e_info in edges:
            from_slug = e_info.get("from_category")
            to_slug = e_info.get("to_category")
            rel_type = e_info.get("relation_type", "belongs_to")

            from_cat = Category.objects.filter(slug=from_slug).first() if from_slug else None
            to_cat = Category.objects.filter(slug=to_slug).first() if to_slug else None

            if from_cat and to_cat:
                edge, created = CategoryEdge.objects.update_or_create(
                    from_category=from_cat,
                    to_category=to_cat,
                    relation_type=rel_type,
                    defaults={
                        "weight": e_info.get("weight", 1.0),
                        "metadata": e_info.get("metadata", {}),
                    },
                )
                if created:
                    context.stats.record_created()
                    context.write(
                        f"  + CategoryEdge created: {from_cat.name} -> {to_cat.name} ({rel_type})"
                    )
                else:
                    context.stats.record_updated()
                    context.write(
                        f"  * CategoryEdge updated: {from_cat.name} -> {to_cat.name} ({rel_type})"
                    )
            else:
                context.stats.record_skipped()
                context.write(f"  ! Skipped edge: missing {from_slug} or {to_slug}")
