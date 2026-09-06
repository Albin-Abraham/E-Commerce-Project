"""Product knowledge resolution: product-level SPEC_SHEET authored once in
metadata, variant inheritance, and by_attributes overrides layered on default specs."""

from django.test import TestCase

from apps.knowledgebase.models.kb import KnowledgeArticle, ProductKnowledgeLink
from apps.shop.application.services.product_knowledge_service import ProductKnowledgeService
from apps.shop.infrastructure.models.product import Product
from apps.shop.infrastructure.models.variant import ProductVariant


class ProductKnowledgeServiceTestCase(TestCase):

    def _seq(self):
        seq = getattr(self, "_seq_counter", 0) + 1
        self._seq_counter = seq
        return seq

    def _product(self):
        seq = self._seq()
        return Product.objects.create(
            name=f"Knowledge Product {seq}",
            sku=f"KNO-{seq:04}",
            price="100.00",
        )

    def _variant(self, product, attributes):
        seq = self._seq()
        return ProductVariant.objects.create(
            product=product,
            sku=f"KNO-{seq:04}-V",
            price="100.00",
            attributes=attributes,
        )

    def _article(self, metadata=None, status="PUBLISHED"):
        seq = self._seq()
        return KnowledgeArticle.objects.create(
            title=f"Article {seq}",
            slug=f"article-{seq}",
            content=f"Body {seq}",
            metadata=metadata or {},
            status=status,
        )

    def _link(self, article, product=None, variant=None, link_type="SPEC_SHEET"):
        return ProductKnowledgeLink.objects.create(
            article=article, product=product, variant=variant, link_type=link_type,
        )

    def test_plain_spec_sheet_resolved_at_product_level(self):
        product = self._product()
        specs_article = self._article(metadata={"specs": {"material": "Cotton", "weight": "180 gsm"}})
        manual = self._article()
        self._link(specs_article, product=product)
        self._link(manual, product=product, link_type="USER_MANUAL")

        result = ProductKnowledgeService.resolve_knowledge_content(product)

        self.assertEqual(
            result["specifications"],
            {"material": "Cotton", "weight": "180 gsm"},
        )
        self.assertEqual(len(result["descriptions"]), 1, "USER_MANUAL lands in descriptions")
        self.assertEqual(len(result["articles"]), 2)

    def test_variant_inherits_product_level_spec_sheet(self):
        product = self._product()
        article = self._article(metadata={"specs": {"material": "Cotton"}})
        self._link(article, product=product)
        variant = self._variant(product, {"color": "Black", "size": "XL"})

        result = ProductKnowledgeService.resolve_knowledge_content(variant)

        self.assertEqual(result["specifications"], {"material": "Cotton"})
        self.assertEqual(len(result["articles"]), 1, "parent product record inherited")

    def test_by_attributes_override_layers_on_default_specs(self):
        product = self._product()
        article = self._article(
            metadata={
                "specs": {
                    "default": {"material": "Cotton", "care": "Machine wash"},
                    "by_attributes": {
                        "color:Black|size:XL": {"care": "Hand wash only"},
                    },
                }
            }
        )
        self._link(article, product=product)

        base = ProductKnowledgeService.resolve_knowledge_content(product)
        self.assertEqual(base["specifications"]["care"], "Machine wash")
        self.assertEqual(base["specifications"]["material"], "Cotton")

        matched = self._variant(product, {"color": "Black", "size": "XL"})
        result = ProductKnowledgeService.resolve_knowledge_content(matched)
        self.assertEqual(result["specifications"]["care"], "Hand wash only")
        self.assertEqual(result["specifications"]["material"], "Cotton", "override layers atop the base")

    def test_unmatched_variant_falls_back_to_default_specs(self):
        product = self._product()
        article = self._article(
            metadata={
                "specs": {
                    "default": {"care": "Machine wash"},
                    "by_attributes": {"color:Black|size:XL": {"care": "Hand wash only"}},
                }
            }
        )
        self._link(article, product=product)
        variant = self._variant(product, {"color": "Red", "size": "S"})

        result = ProductKnowledgeService.resolve_knowledge_content(variant)
        self.assertEqual(result["specifications"]["care"], "Machine wash")

    def test_variant_level_spec_sheet_overrides_product_level(self):
        product = self._product()
        product_article = self._article(metadata={"specs": {"care": "Machine wash"}})
        variant_article = self._article(metadata={"specs": {"care": "Dry clean"}})
        self._link(product_article, product=product)
        variant = self._variant(product, {"color": "Black", "size": "XL"})
        self._link(variant_article, variant=variant)

        result = ProductKnowledgeService.resolve_knowledge_content(variant)
        self.assertEqual(result["specifications"]["care"], "Dry clean", "variant record wins")

    def test_multiple_spec_sheets_stack(self):
        product = self._product()
        self._link(self._article(metadata={"specs": {"material": "Cotton"}}), product=product)
        self._link(self._article(metadata={"specs": {"care": "Machine wash"}}), product=product)

        result = ProductKnowledgeService.resolve_knowledge_content(product)
        self.assertEqual(result["specifications"], {"material": "Cotton", "care": "Machine wash"})

    def test_draft_articles_are_skipped(self):
        product = self._product()
        draft = self._article(metadata={"specs": {"material": "Silk"}}, status="DRAFT")
        self._link(draft, product=product)

        result = ProductKnowledgeService.resolve_knowledge_content(product)
        self.assertEqual(result["specifications"], {})
        self.assertEqual(result["articles"], [])

    def test_link_type_routing_is_data_driven_by_valueset_section(self):
        product = self._product()
        pitch = self._article(metadata={})
        cert = self._article(metadata={})
        self._link(pitch, product=product, link_type="CASHIER_PITCH")
        self._link(cert, product=product, link_type="COMPLIANCE_CERT")

        result = ProductKnowledgeService.resolve_knowledge_content(product)
        self.assertEqual(len(result["cashier_pitches"]), 1, "routed via valueset metadata section")
        self.assertEqual(len(result["compliance_certificates"]), 1)
        self.assertEqual(result["descriptions"], [], "typed content is not dumped into descriptions")
        self.assertEqual(len(result["articles"]), 2)

    def test_unknown_link_type_falls_back_to_descriptions_not_dropped(self):
        product = self._product()
        article = self._article(metadata={})
        self._link(article, product=product, link_type="CUSTOM_RESEARCH_NOTE")

        result = ProductKnowledgeService.resolve_knowledge_content(product)
        self.assertEqual(len(result["descriptions"]), 1, "unknown type still surfaces as a description")
        self.assertEqual(len(result["articles"]), 1)