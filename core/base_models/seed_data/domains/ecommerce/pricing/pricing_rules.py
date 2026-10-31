from __future__ import annotations

from typing import Any

from core.base_models.seed_data.engine.base import BaseSeedModule
from core.base_models.seed_data.engine.context import SeedContext


class PricingRuleSeedModule(BaseSeedModule):
    name = "pricing_rules"
    section = "pricing"
    depends_on = ["price_lists", "products"]

    def validate(self, context: SeedContext, raw_data: Any) -> list[str]:
        errors = []
        rules = raw_data.get("pricing_rules", []) if isinstance(raw_data, dict) else []
        for i, r in enumerate(rules):
            if not r.get("name"):
                errors.append(f"PricingRule at index {i} is missing required 'name'")
            if not r.get("price_list_code"):
                errors.append(f"PricingRule at index {i} is missing required 'price_list_code'")
        return errors

    def execute(self, context: SeedContext, raw_data: Any) -> None:
        from apps.shop.infrastructure.models.pricing import PriceList, PricingRule
        from apps.shop.infrastructure.models.product import Product
        from core.admin.models.company import Company

        rules = raw_data.get("pricing_rules", []) if isinstance(raw_data, dict) else []
        target_company = context.company or Company.objects.first()

        for r_info in rules:
            name = r_info.get("name")
            pl_code = r_info.get("price_list_code")
            p_sku = r_info.get("product_sku")
            if not name or not pl_code:
                continue

            price_list = PriceList.objects.filter(code=pl_code).first()
            if not price_list:
                context.stats.record_skipped()
                continue

            product = Product.objects.filter(sku=p_sku).first() if p_sku else None
            variant = product.variants.first() if (product and product.variants.exists()) else None

            if not variant:
                context.stats.record_skipped()
                continue

            rule, created = PricingRule.objects.update_or_create(
                name=name,
                defaults={
                    "price_list": price_list,
                    "variant": variant,
                    "min_quantity": r_info.get("min_quantity", 1),
                    "discount_percentage": r_info.get("value", 0.0),
                    "company": target_company,
                },
            )
            if created:
                context.stats.record_created()
                context.write(f"  + PricingRule created: {name} ({pl_code})")
            else:
                context.stats.record_updated()
                context.write(f"  * PricingRule updated: {name} ({pl_code})")
