"""Template variable system for knowledge metadata JSON: schema, context builder,
deep rendering, unresolved-token audit, and resolver integration."""

from django.test import TestCase

from apps.knowledgebase.models.kb import KnowledgeArticle, ProductKnowledgeLink
from apps.shop.application.services.knowledge_template import KnowledgeTemplateEngine
from apps.shop.application.services.product_knowledge_service import ProductKnowledgeService
from apps.shop.infrastructure.models.product import Product
from apps.shop.infrastructure.models.variant import ProductVariant


class KnowledgeTemplateEngineTestCase(TestCase):

    def _seq(self):
        seq = getattr(self, "_seq_counter", 0) + 1
        self._seq_counter = seq
        return seq

    def _product(self):
        seq = self._seq()
        return Product.objects.create(
            name=f"Template Product {seq}",
            sku=f"TPL-{seq:04}",
            price="100.00",
        )

    def test_available_variables_schema_is_structured(self):
        variables = KnowledgeTemplateEngine.available_variables()
        self.assertTrue(variables)
        for var in variables:
            self.assertEqual(
                set(var.keys()), {"path", "label", "description"},
                "editors get a discoverable token schema",
            )
        self.assertIn("product.sku", [var["path"] for var in variables])

    def test_render_string_resolves_known_variables(self):
        product = self._product()
        context = KnowledgeTemplateEngine.build_context(product)

        rendered = KnowledgeTemplateEngine.render(
            "{{ product.name }} ships today ({{ context.date }})",
            context,
        )
        self.assertTrue(rendered.startswith(f"{product.name} ships today ("))
        self.assertIn("20", rendered)

    def test_deep_render_json_structure(self):
        product = self._product()
        context = KnowledgeTemplateEngine.build_context(product)
        payload = {
            "specs": {"label": "{{ product.name }}"},
            "tags": ["{{ product.sku }}", "plain"],
            "nested": {"code": "{{ product.price }}"},
        }

        rendered = KnowledgeTemplateEngine.render(payload, context)

        self.assertEqual(rendered["specs"]["label"], product.name)
        self.assertEqual(rendered["tags"][0], product.sku)
        self.assertEqual(rendered["nested"]["code"], "100.00")

    def test_variant_context_holds_attributes_and_inherits_product(self):
        product = self._product()
        variant = ProductVariant.objects.create(
            product=product, sku=f"{product.sku}-XL", price="110.00",
            attributes={"color": "Black", "size": "XL"},
        )
        context = KnowledgeTemplateEngine.build_context(variant)

        self.assertEqual(context["product"]["name"], product.name)
        self.assertEqual(context["variant"]["sku"], variant.sku)
        self.assertEqual(context["variant"]["attributes"]["color"], "Black")
        self.assertEqual(
            KnowledgeTemplateEngine.render("{{ variant.attributes.size }}", context),
            "XL",
        )

    def test_unknown_variable_preserved_and_reported(self):
        product = self._product()
        context = KnowledgeTemplateEngine.build_context(product)
        payload = {"spec": "{{ missing.thing }} and {{ product.sku }}"}

        result = KnowledgeTemplateEngine.classify(payload, context)

        self.assertEqual(result["payload"]["spec"], "{{ missing.thing }} and " + product.sku)
        self.assertEqual(result["unresolved"], ["missing.thing"])

    def test_variables_used_returns_unique_paths(self):
        used = KnowledgeTemplateEngine.variables_used(
            {"a": "{{ product.name }} + {{ product.name }}", "b": ["{{ variant.sku }}"]}
        )
        self.assertEqual(used, ["product.name", "variant.sku"])

    def test_resolver_integrates_template_variables(self):
        product = self._product()
        article = KnowledgeArticle.objects.create(
            title=f"TPL Article {self._seq()}",
            slug=f"tpl-article-{self._seq()}-{(self._seq())}",
            content="body",
            metadata={
                "specs": {
                    "default": {
                        "label": "{{ product.name }} ({{ product.sku }})",
                        "fit": "{{ variant.attributes.fit }} standard",
                    },
                    "by_attributes": {
                        "color:Black|size:XL": {"dimension": "{{ variant.attributes.size }} inches"},
                    },
                }
            },
        )
        ProductKnowledgeLink.objects.create(
            article=article, product=product, link_type="SPEC_SHEET",
        )

        variant = ProductVariant.objects.create(
            product=product, sku=f"{product.sku}-V", price="105.00",
            attributes={"color": "Black", "size": "XL"},
        )

        product_result = ProductKnowledgeService.resolve_knowledge_with_templates(product)
        self.assertEqual(product_result["payload"]["specifications"]["label"], f"{product.name} ({product.sku})")
        self.assertEqual(
            product_result["payload"]["specifications"]["fit"],
            "{{ variant.attributes.fit }} standard",
            "unresolved variant token is left intact at product level",
        )
        self.assertIn("variant.attributes.fit", product_result["unresolved"])

        variant_result = ProductKnowledgeService.resolve_knowledge_with_templates(variant)
        self.assertEqual(
            variant_result["payload"]["specifications"]["label"],
            f"{product.name} ({product.sku})",
        )
        self.assertEqual(
            variant_result["payload"]["specifications"]["dimension"],
            "XL inches",
            "variant attribute override renders live",
        )

    def test_resolution_renders_templates_by_default(self):
        product = self._product()
        article = KnowledgeArticle.objects.create(
            title=f"TPL Article {self._seq()}",
            slug=f"tpl-article-{self._seq()}-{(self._seq())}",
            content="body",
            metadata={"specs": {"label": "{{ product.sku }} ready"}},
        )
        ProductKnowledgeLink.objects.create(
            article=article, product=product, link_type="SPEC_SHEET",
        )

        rendered = ProductKnowledgeService.resolve_knowledge_content(product)
        self.assertEqual(
            rendered["specifications"]["label"],
            f"{product.sku} ready",
            "serializer-facing path renders tokens out of the box",
        )

        raw = ProductKnowledgeService.resolve_knowledge_content(product, render=False)
        self.assertEqual(raw["specifications"]["label"], "{{ product.sku }} ready")

    def test_resolution_surfaces_custom_routed_sections(self):
        product = self._product()
        article = KnowledgeArticle.objects.create(
            title=f"HAZMAT {self._seq()}",
            slug=f"hazmat-{self._seq()}-{(self._seq())}",
            content="keep away from heat",
            metadata={"knowledge_section": "hazmat_warnings"},
        )
        ProductKnowledgeLink.objects.create(
            article=article, product=product, link_type="SPEC_SHEET",
        )

        result = ProductKnowledgeService.resolve_knowledge_content(product)

        self.assertIn(
            "hazmat_warnings", result,
            "custom sections are returned top-level instead of being dropped",
        )
        self.assertEqual(len(result["hazmat_warnings"]), 1)
        self.assertEqual(result["hazmat_warnings"][0]["content"], "keep away from heat")

    def test_by_attributes_partial_match_falls_back_gracefully(self):
        product = self._product()
        article = KnowledgeArticle.objects.create(
            title=f"TPL Article {self._seq()}",
            slug=f"tpl-article-{self._seq()}-{(self._seq())}",
            content="body",
            metadata={
                "specs": {
                    "default": {"finish": "standard"},
                    "by_attributes": {"color:Red": {"finish": "matte red"}},
                }
            },
        )
        ProductKnowledgeLink.objects.create(
            article=article, product=product, link_type="SPEC_SHEET",
        )

        two_dim = ProductVariant.objects.create(
            product=product, sku=f"{product.sku}-R", price="110.00",
            attributes={"color": "Red", "size": "XL"},
        )
        missing_attr = ProductVariant.objects.create(
            product=product, sku=f"{product.sku}-M", price="95.00",
            attributes={"size": "M"},
        )

        result = ProductKnowledgeService.resolve_knowledge_content(two_dim)
        self.assertEqual(
            result["specifications"]["finish"], "matte red",
            "single-attribute editor key drives a two-attribute variant",
        )

        fallback = ProductKnowledgeService.resolve_knowledge_content(missing_attr)
        self.assertEqual(
            fallback["specifications"]["finish"], "standard",
            "no partial match degrades to the author's default, never drops",
        )