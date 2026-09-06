"""Template variables for Knowledge metadata JSON.

Content authors can embed structured, dynamic placeholders in KnowledgeArticle
metadata (and derived knowledge payloads) that are resolved at read-time against
the target entity's context instead of being hardcoded:

    "specs": {
        "default": {"label": "{{ product.name }} ({{ product.sku }})"},
        "by_attributes": {
            "color:Black|size:XL": {"care": "Hand wash {{ variant.attributes.size }}"}
        }
    }

The available variables are declared as a schema (AvailableVariable) so editors
get a discoverable, validated token list instead of arbitrary interpolation.
Unknown placeholders are preserved verbatim so content never silently drops.
"""

import re
from dataclasses import dataclass

from django.utils import timezone

from apps.shop.infrastructure.models.category import Category
from apps.shop.infrastructure.models.inventory import Inventory
from apps.shop.infrastructure.models.product import Product
from apps.shop.infrastructure.models.variant import ProductVariant

VARIABLE_PATTERN = re.compile(r"\{\{\s*([A-Za-z0-9_.]+)\s*\}\}")


@dataclass(frozen=True)
class AvailableVariable:
    path: str
    label: str
    description: str


class KnowledgeTemplateEngine:
    """Registry of known template variables + context builder + deep renderer."""

    AVAILABLE_VARIABLES = [
        AvailableVariable("product.name", "Product name", "Name of the product"),
        AvailableVariable("product.sku", "Product SKU", "Unique product SKU"),
        AvailableVariable("product.slug", "Product slug", "URL-safe product slug"),
        AvailableVariable("product.price", "Product price", "Unit price of the product"),
        AvailableVariable("variant.sku", "Variant SKU", "SKU of the matched variant"),
        AvailableVariable("variant.price", "Variant price", "Unit price of the matched variant"),
        AvailableVariable("variant.attributes", "Variant options", "Key/value map of variant options, e.g. color, size"),
        AvailableVariable("category.name", "Category name", "First assigned shop category"),
        AvailableVariable("company.name", "Company name", "Owning tenant company"),
        AvailableVariable("company.base_currency", "Base currency", "Company reporting currency code"),
        AvailableVariable("context.date", "Current date", "Today's local date (ISO)"),
    ]

    @classmethod
    def available_variables(cls) -> list[dict]:
        return [
            {"path": v.path, "label": v.label, "description": v.description}
            for v in cls.AVAILABLE_VARIABLES
        ]

    @classmethod
    def _price(cls, value):
        if value is None:
            return None
        return str(value)

    @classmethod
    def build_context(cls, target) -> dict:
        """Builds the resolvable variable namespace for a target entity."""
        context = {
            "context": {
                "date": timezone.localdate().isoformat(),
            }
        }

        if isinstance(target, Product):
            cls._product_context(context, target)
        elif isinstance(target, ProductVariant):
            cls._product_context(context, target.product)
            context["variant"] = {
                "sku": target.sku,
                "price": cls._price(target.price),
                "attributes": dict(target.attributes or {}),
            }
        elif isinstance(target, Inventory):
            if target.variant:
                cls._product_context(context, target.variant.product)
                context["variant"] = {
                    "sku": target.variant.sku,
                    "price": cls._price(target.variant.price),
                    "attributes": dict(target.variant.attributes or {}),
                }
        elif isinstance(target, Category):
            context["category"] = {"name": target.name, "slug": target.slug}

        return context

    @classmethod
    def _product_context(cls, context, product):
        if product is None:
            return context
        context["product"] = {
            "name": product.name,
            "sku": product.sku,
            "slug": product.slug,
            "price": cls._price(product.price),
        }
        company = getattr(product, "company", None)
        if company is not None:
            context["company"] = {"name": company.name}
            currency = getattr(company, "default_currency", None)
            if currency is not None:
                context["company"]["base_currency"] = getattr(currency, "code", None)
        category = getattr(product, "category", None)
        if category is not None:
            context["category"] = {"name": category.name, "slug": category.slug}
        return context

    @classmethod
    def _lookup(cls, context, path: str):
        current = context
        for part in path.split("."):
            if isinstance(current, dict) and part in current:
                current = current[part]
            else:
                return None
        return current

    @classmethod
    def _render_string(cls, template: str, context: dict) -> str:
        def substitute(match):
            value = cls._lookup(context, match.group(1))
            if value is None:
                return match.group(0)
            if isinstance(value, (dict, list)):
                import json
                return json.dumps(value)
            return str(value)

        return VARIABLE_PATTERN.sub(substitute, template)

    @classmethod
    def render(cls, value, context: dict):
        """Deep-renders template variables inside strings of a JSON structure."""
        if isinstance(value, str):
            return cls._render_string(value, context)
        if isinstance(value, list):
            return [cls.render(item, context) for item in value]
        if isinstance(value, dict):
            return {key: cls.render(item, context) for key, item in value.items()}
        return value

    @classmethod
    def variables_used(cls, value) -> list[str]:
        """Returns the ordered list of template variable paths found in a JSON structure."""
        found = []

        def walk(node):
            if isinstance(node, str):
                found.extend(VARIABLE_PATTERN.findall(node))
            elif isinstance(node, list):
                for item in node:
                    walk(item)
            elif isinstance(node, dict):
                for item in node.values():
                    walk(item)

        walk(value)
        seen = set()
        unique = []
        for path in found:
            if path not in seen:
                seen.add(path)
                unique.append(path)
        return unique

    @classmethod
    def classify(cls, payload: dict, context: dict) -> dict:
        """Renders the payload and reports unresolved variables for audit/QA."""
        resolved = cls.render(payload, context)
        unresolved = [
            path
            for path in cls.variables_used(payload)
            if cls._lookup(context, path) is None
        ]
        return {"payload": resolved, "unresolved": unresolved}