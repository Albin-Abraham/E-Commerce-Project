import logging
from django.db import models
from apps.knowledgebase.models.kb import ProductKnowledgeLink, KnowledgeArticle
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
    """

    @classmethod
    def resolve_knowledge_content(cls, target) -> dict:
        """
        Resolves all linked Knowledgebase content for a given Product, Variant, Inventory, or Category instance.
        Matches by Foreign Key reference OR target_identifier string (ID/Slug/SKU).
        """
        if not target:
            return {}

        query = models.Q(is_active=True)

        if isinstance(target, Product):
            query &= (
                models.Q(product=target)
                | models.Q(target_identifier=target.id)
                | models.Q(target_identifier=target.slug)
                | models.Q(target_identifier=target.sku)
            )
        elif isinstance(target, ProductVariant):
            query &= (
                models.Q(variant=target)
                | models.Q(target_identifier=target.id)
                | models.Q(target_identifier=target.sku)
            )
        elif isinstance(target, Inventory):
            query &= (
                models.Q(inventory=target)
                | models.Q(target_identifier=target.id)
            )
            if target.variant:
                query |= models.Q(variant=target.variant) | models.Q(target_identifier=target.variant.sku)
        elif isinstance(target, Category):
            query &= (
                models.Q(shop_category=target)
                | models.Q(target_identifier=target.id)
                | models.Q(target_identifier=target.slug)
            )
        elif isinstance(target, str):
            query &= models.Q(target_identifier=target)

        links = ProductKnowledgeLink.objects.filter(query).select_related("article")

        specs = {}
        descriptions = []
        cashier_pitches = []
        compliance_certs = []
        assembly_diagrams = []
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

            if link.link_type == ProductKnowledgeLink.LinkType.SPEC_SHEET:
                if isinstance(art.metadata, dict) and "specs" in art.metadata:
                    specs.update(art.metadata["specs"])
                else:
                    specs[art.title] = art.summary or art.content
            elif link.link_type == ProductKnowledgeLink.LinkType.CASHIER_PITCH:
                cashier_pitches.append(article_data)
            elif link.link_type == ProductKnowledgeLink.LinkType.COMPLIANCE_CERT:
                compliance_certs.append(article_data)
            elif link.link_type == ProductKnowledgeLink.LinkType.ASSEMBLY_BOM:
                assembly_diagrams.append(article_data)
            else:
                descriptions.append(article_data)

        return {
            "specifications": specs,
            "descriptions": descriptions,
            "cashier_pitches": cashier_pitches,
            "compliance_certificates": compliance_certs,
            "assembly_diagrams": assembly_diagrams,
            "articles": all_articles,
        }
