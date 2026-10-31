from __future__ import annotations

from typing import Any

from core.base_models.seed_data.engine.base import BaseSeedModule
from core.base_models.seed_data.engine.context import SeedContext


class ProductSeedModule(BaseSeedModule):
    name = "products"
    section = "catalog"
    depends_on = ["brands", "categories", "attributes"]

    def validate(self, context: SeedContext, raw_data: Any) -> list[str]:
        errors = []
        products = raw_data.get("products", []) if isinstance(raw_data, dict) else []
        for i, p in enumerate(products):
            if not p.get("sku"):
                errors.append(f"Product at index {i} is missing required 'sku'")
            if not p.get("name"):
                errors.append(f"Product at index {i} is missing required 'name'")
            if not p.get("slug"):
                errors.append(f"Product at index {i} is missing required 'slug'")
        return errors

    def execute(self, context: SeedContext, raw_data: Any) -> None:
        from apps.shop.infrastructure.models.brand import Brand
        from apps.shop.infrastructure.models.category import Category
        from apps.shop.infrastructure.models.product import Product

        products = raw_data.get("products", []) if isinstance(raw_data, dict) else []
        for p_info in products:
            sku = p_info.get("sku")
            name = p_info.get("name")
            slug = p_info.get("slug")
            if not sku or not name or not slug:
                continue

            brand_obj = None
            brand_slug = p_info.get("brand")
            if brand_slug:
                brand_obj = Brand.objects.filter(slug=brand_slug).first()

            cat_obj = None
            cat_slug = p_info.get("category")
            if cat_slug:
                cat_obj = Category.objects.filter(slug=cat_slug).first()

            metadata = p_info.get("metadata", {})
            if "description" in p_info and "description" not in metadata:
                metadata["description"] = p_info["description"]

            product, created = Product.objects.update_or_create(
                sku=sku,
                defaults={
                    "name": name,
                    "slug": slug,
                    "brand": brand_obj,
                    "category": cat_obj,
                    "price": p_info.get("price", 0.0),
                    "status": p_info.get("status", "ACTIVE"),
                    "is_active": p_info.get("is_active", True),
                    "metadata": metadata,
                    "extensions": p_info.get("extensions", {}),
                },
            )
            if created:
                context.stats.record_created()
                context.write(f"  + Product created: {name} ({sku})")
            else:
                context.stats.record_updated()
                context.write(f"  * Product updated: {name} ({sku})")
