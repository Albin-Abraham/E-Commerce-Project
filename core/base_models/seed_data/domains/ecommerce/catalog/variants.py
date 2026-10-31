from __future__ import annotations

from typing import Any

from core.base_models.seed_data.engine.base import BaseSeedModule
from core.base_models.seed_data.engine.context import SeedContext


class VariantSeedModule(BaseSeedModule):
    name = "product_variants"
    section = "catalog"
    depends_on = ["products"]

    def validate(self, context: SeedContext, raw_data: Any) -> list[str]:
        errors = []
        variants = raw_data.get("variants", []) if isinstance(raw_data, dict) else []
        for i, v in enumerate(variants):
            if not v.get("sku"):
                errors.append(f"Variant at index {i} is missing required 'sku'")
            if not v.get("product_sku"):
                errors.append(f"Variant at index {i} is missing required 'product_sku'")
        return errors

    def execute(self, context: SeedContext, raw_data: Any) -> None:
        from apps.shop.infrastructure.models.product import Product
        from apps.shop.infrastructure.models.variant import ProductVariant

        variants = raw_data.get("variants", []) if isinstance(raw_data, dict) else []
        for v_info in variants:
            v_sku = v_info.get("sku")
            p_sku = v_info.get("product_sku")
            if not v_sku or not p_sku:
                continue

            product = Product.objects.filter(sku=p_sku).first()
            if not product:
                context.stats.record_skipped()
                context.write(f"  ! Skipped variant {v_sku}: parent product {p_sku} not found")
                continue

            variant, created = ProductVariant.objects.update_or_create(
                sku=v_sku,
                defaults={
                    "product": product,
                    "price": v_info.get("price", product.price),
                    "compare_at_price": v_info.get("compare_at_price"),
                    "barcode": v_info.get("barcode"),
                    "status": v_info.get("status", "ACTIVE"),
                    "attributes": v_info.get("attributes", {}),
                    "is_active": v_info.get("is_active", True),
                },
            )
            if created:
                context.stats.record_created()
                context.write(f"  + Variant created: {v_sku} (for {p_sku})")
            else:
                context.stats.record_updated()
                context.write(f"  * Variant updated: {v_sku} (for {p_sku})")
