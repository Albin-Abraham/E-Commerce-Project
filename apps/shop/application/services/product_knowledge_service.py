import itertools
import logging
from django.db import models
from django.db.models import Case, IntegerField, Value, When
from shared_domain.base.valuesets import ValueSetRegistry
from apps.knowledgebase.models.kb import ProductKnowledgeLink, KnowledgeArticle
from apps.shop.application.services.knowledge_template import KnowledgeTemplateEngine
from apps.shop.infrastructure.models.product import Product
from apps.shop.infrastructure.models.variant import ProductVariant
from apps.shop.infrastructure.models.inventory import Inventory
from apps.shop.infrastructure.models.category import Category

logger = logging.getLogger(__name__)


class ProductKnowledgeService:
    """
    Application Service resolving dynamic Specifications, Content Copywriting,
    Cashier Pitches, Compliance Certificates, and User Manuals from Knowledgebase (apps.knowledgebase).

    Decouples content management from core relational domain models.
    Spec sheets are authored once at Product level inside `KnowledgeArticle.metadata`
    and can carry per-variant overrides:

        {
            "specs": {
                "default": {"material": "Cotton", "care": "Machine wash"},
                "by_attributes": {
                    "color:Black|size:XL": {"care": "Hand wash only"}
                }
            }
        }

    When resolved for a variant its `attributes` are matched against `by_attributes`
    keys that override the `default` base; unmatched variants fall back to `default`.
    """

    @classmethod
    def _specs_key(cls, attributes) -> str:
        """Normalises a variant attributes dict into a lookup key, e.g. {'color': 'Black', 'size': 'XL'} -> 'color:Black|size:XL'."""
        if not isinstance(attributes, dict):
            return ""
        return "|".join(f"{k}:{v}" for k, v in sorted(attributes.items()))

    @classmethod
    def _specs_overrides(cls, overrides: dict, variant_attributes: dict):
        """
        Picks the best-matching `by_attributes` override for a variant.
        Exact full-key match wins; otherwise the largest matching attribute subset
        (e.g. "color:Black" driving a two-attribute variant), deterministically,
        so an editor typo or extra option falls back gracefully instead of dropping.
        """
        if not isinstance(overrides, dict) or not variant_attributes:
            return None

        full_key = cls._specs_key(variant_attributes)
        matched = overrides.get(full_key)
        if isinstance(matched, dict):
            return matched

        tokens = [f"{k}:{v}" for k, v in sorted(variant_attributes.items())]
        for size in range(len(tokens) - 1, 0, -1):
            for combo in itertools.combinations(tokens, size):
                found = overrides.get("|".join(combo))
                if isinstance(found, dict):
                    return found
        return None

    @classmethod
    def _merge_spec_sheet(cls, specs: dict, article, variant_attributes: dict | None) -> dict:
        """
        Merges one SPEC_SHEET article's specifications into `specs`.
        `metadata["specs"]` supports:
          - plain dict:                      updated verbatim
          - {"default": {...}, "by_attributes": {"key": {...}}}: default applied, then any
            by_attributes overrides matching the variant attributes are layered on top.
        Empty leaves keep the previously accumulated base so multiple articles stack cleanly.
        """
        metadata = article.metadata if isinstance(article.metadata, dict) else {}
        raw = metadata.get("specs")

        if isinstance(raw, dict) and ("default" in raw or "by_attributes" in raw):
            base = raw.get("default")
            if isinstance(base, dict):
                specs.update(base)
            matched = cls._specs_overrides(raw.get("by_attributes"), variant_attributes)
            if isinstance(matched, dict):
                specs.update(matched)
        elif isinstance(raw, dict):
            specs.update(raw)
        else:
            specs[article.title] = article.summary or article.content

        return specs

    @classmethod
    def resolve_knowledge_content(cls, target, render: bool = True) -> dict:
        """
        Resolves all linked Knowledgebase content for a given Product, Variant, Inventory, or Category instance.
        Matches by Foreign Key reference OR target_identifier string (ID/Slug/SKU).

        A ProductVariant inherits its parent Product's knowledge record (Spec Sheets, manuals, pitches)
        so content can be authored once per product while still allowing variant-specific overrides.
        Template variables in metadata are rendered by default against the target context.
        """
        if not target:
            return {}

        match = models.Q()
        variant_attributes = None

        if isinstance(target, Product):
            match |= (
                models.Q(product=target)
                | models.Q(target_identifier=target.id)
                | models.Q(target_identifier=target.slug)
                | models.Q(target_identifier=target.sku)
            )
        elif isinstance(target, ProductVariant):
            variant_attributes = target.attributes or {}
            match |= (
                models.Q(variant=target)
                | models.Q(target_identifier=target.id)
                | models.Q(target_identifier=target.sku)
            )
            if target.product_id:
                match |= (
                    models.Q(product=target.product)
                    | models.Q(target_identifier=target.product.id)
                    | models.Q(target_identifier=target.product.slug)
                    | models.Q(target_identifier=target.product.sku)
                )
        elif isinstance(target, Inventory):
            match |= (
                models.Q(inventory=target)
                | models.Q(target_identifier=target.id)
            )
            if target.variant:
                match |= models.Q(variant=target.variant) | models.Q(target_identifier=target.variant.sku)
        elif isinstance(target, Category):
            match |= (
                models.Q(shop_category=target)
                | models.Q(target_identifier=target.id)
                | models.Q(target_identifier=target.slug)
            )
        elif isinstance(target, str):
            match |= models.Q(target_identifier=target)

        # Generic (product/category-level) links first; variant/inventory-specific links
        # last so the more specific record layers on top in deterministic order.
        links = (
            ProductKnowledgeLink.objects.filter(models.Q(is_active=True) & match)
            .select_related("article")
            .annotate(
                specificity=Case(
                    When(variant__isnull=False, then=Value(1)),
                    default=Value(0),
                    output_field=IntegerField(),
                )
            )
            .order_by("specificity", "created_at")
        )

        sections = {
            "specifications": {},
            "descriptions": [],
            "cashier_pitches": [],
            "compliance_certificates": [],
            "assembly_diagrams": [],
        }
        link_types = ValueSetRegistry.get("product_knowledge_link_type")
        all_articles = []

        for link in links:
            art = link.article
            if art.status != KnowledgeArticle.ArticleStatus.PUBLISHED:
                continue

            article_data = {
                "id": art.id,
                "title": art.title,
                "slug": art.slug,
                "summary": art.summary,
                "content": art.content,
                "link_type": link.link_type,
                "notes": link.notes,
            }
            all_articles.append(article_data)

            section = "descriptions"
            item = link_types.get(link.link_type)
            metadata = item.metadata if item else None
            if isinstance(metadata, dict) and metadata.get("section"):
                section = metadata["section"]

            # Article metadata may route any link's content into a custom section
            # (e.g. an overlay of section on the article so teams can introduce new
            # knowledge buckets without a code deploy). Unknown sections surface
            # top-level so no content is ever dropped.
            article_metadata = art.metadata if isinstance(art.metadata, dict) else {}
            if article_metadata.get("knowledge_section"):
                section = article_metadata["knowledge_section"]

            if section == "specifications":
                cls._merge_spec_sheet(sections["specifications"], art, variant_attributes)
            else:
                sections.setdefault(section, []).append(article_data)

        result = {
            "specifications": sections["specifications"],
            "descriptions": sections["descriptions"],
            "cashier_pitches": sections["cashier_pitches"],
            "compliance_certificates": sections["compliance_certificates"],
            "assembly_diagrams": sections["assembly_diagrams"],
            "articles": all_articles,
        }
        for section, content in sections.items():
            if section not in result:
                result[section] = content

        if render:
            context = KnowledgeTemplateEngine.build_context(target)
            return KnowledgeTemplateEngine.render(result, context)

        return result

    @classmethod
    def resolve_knowledge_with_templates(cls, target) -> dict:
        """
        Resolves knowledge AND deep-renders every {{ variable }} token against
        the target entity's available-variable context, reporting any unresolved
        tokens for QA so no content is silently dropped.
        """
        raw = cls.resolve_knowledge_content(target, render=False)
        context = KnowledgeTemplateEngine.build_context(target)
        return KnowledgeTemplateEngine.classify(raw, context)
