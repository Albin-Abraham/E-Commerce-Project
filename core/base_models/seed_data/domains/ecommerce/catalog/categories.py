from __future__ import annotations

from typing import Any

from core.base_models.seed_data.engine.base import BaseSeedModule
from core.base_models.seed_data.engine.context import SeedContext


class CategorySeedModule(BaseSeedModule):
    name = "categories"
    section = "catalog"
    depends_on = []

    def validate(self, context: SeedContext, raw_data: Any) -> list[str]:
        errors = []
        categories = raw_data.get("categories", []) if isinstance(raw_data, dict) else []
        seen_slugs = set()
        for i, c in enumerate(categories):
            slug = c.get("slug")
            if not c.get("name"):
                errors.append(f"Category at index {i} is missing required 'name'")
            if not slug:
                errors.append(f"Category at index {i} is missing required 'slug'")
            elif slug in seen_slugs:
                errors.append(f"Duplicate category slug found: '{slug}'")
            seen_slugs.add(slug)
        return errors

    def execute(self, context: SeedContext, raw_data: Any) -> None:
        from apps.shop.infrastructure.models.category import Category

        categories = raw_data.get("categories", []) if isinstance(raw_data, dict) else []
        # Sort so root categories (parent is null) are seeded before sub-categories
        sorted_categories = sorted(categories, key=lambda c: 0 if not c.get("parent") else 1)

        for c_info in sorted_categories:
            name = c_info.get("name")
            slug = c_info.get("slug")
            if not name or not slug:
                continue

            parent_cat = None
            parent_slug = c_info.get("parent")
            if parent_slug:
                parent_cat = Category.objects.filter(slug=parent_slug).first()

            category, created = Category.objects.update_or_create(
                slug=slug,
                defaults={
                    "name": name,
                    "parent": parent_cat,
                    "is_active": c_info.get("is_active", True),
                    "metadata": c_info.get("metadata", {}),
                },
            )
            if created:
                context.stats.record_created()
                context.write(f"  + Category created: {name} ({slug})")
            else:
                context.stats.record_updated()
                context.write(f"  * Category updated: {name} ({slug})")
