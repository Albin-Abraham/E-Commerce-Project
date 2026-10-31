from __future__ import annotations

from typing import Any

from core.base_models.seed_data.engine.base import BaseSeedModule
from core.base_models.seed_data.engine.context import SeedContext


class ProductMediaSeedModule(BaseSeedModule):
    name = "product_media"
    section = "catalog"
    depends_on = ["products"]

    def validate(self, context: SeedContext, raw_data: Any) -> list[str]:
        errors = []
        media_list = raw_data.get("media", []) if isinstance(raw_data, dict) else []
        for i, m in enumerate(media_list):
            if not m.get("product_sku"):
                errors.append(f"Media at index {i} is missing 'product_sku'")
            if not m.get("url"):
                errors.append(f"Media at index {i} is missing 'url'")
        return errors

    def execute(self, context: SeedContext, raw_data: Any) -> None:
        from django.contrib.contenttypes.models import ContentType

        from apps.shop.infrastructure.models.polymorphic import Media
        from apps.shop.infrastructure.models.product import Product

        media_list = raw_data.get("media", []) if isinstance(raw_data, dict) else []
        for m_info in media_list:
            p_sku = m_info.get("product_sku")
            url = m_info.get("url")
            if not p_sku or not url:
                continue

            product = Product.objects.filter(sku=p_sku).first()
            if not product:
                context.stats.record_skipped()
                continue

            ct = ContentType.objects.get_for_model(Product)
            media, created = Media.objects.update_or_create(
                url=url,
                content_type=ct,
                object_id=str(product.pk),
                defaults={
                    "alt_text": m_info.get("title", ""),
                    "media_type": "IMAGE",
                    "metadata": {"is_primary": m_info.get("is_primary", False)},
                },
            )
            if created:
                context.stats.record_created()
                context.write(f"  + Media attached: {m_info.get('title')} ({url})")
            else:
                context.stats.record_updated()
                context.write(f"  * Media updated: {m_info.get('title')} ({url})")
