from django.db import models
from import_export import fields, widgets

from apps.shop.infrastructure.models.brand import Brand
from apps.shop.infrastructure.models.catalog import (
    Catalog,
    CatalogCollection,
    CatalogItem,
    TagDefinition,
)
from apps.shop.infrastructure.models.category import Category
from apps.shop.infrastructure.models.product import Product
from apps.shop.infrastructure.models.variant import ProductVariant
from core.base_models.import_mixins import BasePlatformModelResource


class CategoryResource(BasePlatformModelResource):
    parent = fields.Field(
        column_name="parent_slug",
        attribute="parent",
        widget=widgets.ForeignKeyWidget(Category, field="slug"),
    )

    class Meta(BasePlatformModelResource.Meta):
        model = Category
        import_id_fields = ("slug",)
        fields = ("id", "name", "slug", "parent", "is_active")


class BrandResource(BasePlatformModelResource):
    class Meta(BasePlatformModelResource.Meta):
        model = Brand
        import_id_fields = ("name",)
        fields = ("id", "name", "slug", "description", "website", "is_active")


class ProductResource(BasePlatformModelResource):
    category = fields.Field(
        column_name="category_slug",
        attribute="category",
        widget=widgets.ForeignKeyWidget(Category, field="slug"),
    )
    brand = fields.Field(
        column_name="brand_name",
        attribute="brand",
        widget=widgets.ForeignKeyWidget(Brand, field="name"),
    )

    class Meta(BasePlatformModelResource.Meta):
        model = Product
        import_id_fields = ("sku",)
        fields = (
            "id",
            "sku",
            "name",
            "slug",
            "price",
            "category",
            "brand",
            "status",
            "is_active",
        )


class ProductVariantResource(BasePlatformModelResource):
    product = fields.Field(
        column_name="product_sku",
        attribute="product",
        widget=widgets.ForeignKeyWidget(Product, field="sku"),
    )

    class Meta(BasePlatformModelResource.Meta):
        model = ProductVariant
        import_id_fields = ("sku",)
        fields = (
            "id",
            "product",
            "sku",
            "price",
            "compare_at_price",
            "barcode",
            "status",
            "is_active",
        )


class CatalogResource(BasePlatformModelResource):
    class Meta(BasePlatformModelResource.Meta):
        model = Catalog
        import_id_fields = ("code",)
        fields = ("id", "code", "name", "slug", "description", "is_active")


class TagDefinitionResource(BasePlatformModelResource):
    class Meta(BasePlatformModelResource.Meta):
        model = TagDefinition
        import_id_fields = ("code",)
        fields = ("id", "code", "name", "badge_label", "badge_color", "icon_url", "is_active")


class CatalogItemResource(BasePlatformModelResource):
    catalog = fields.Field(
        column_name="catalog",
        attribute="catalog",
        widget=widgets.ForeignKeyWidget(Catalog, field="code"),
    )
    product = fields.Field(
        column_name="product",
        attribute="product",
        widget=widgets.ForeignKeyWidget(Product, field="sku"),
    )
    variant = fields.Field(
        column_name="variant",
        attribute="variant",
        widget=widgets.ForeignKeyWidget(ProductVariant, field="sku"),
    )

    def get_instance(self, instance_loader, row):
        catalog_code = row.get("catalog")
        product_sku = row.get("product")
        variant_sku = row.get("variant")

        if catalog_code and product_sku:
            qs = CatalogItem.objects.filter(
                catalog__code=catalog_code,
                product__sku=product_sku,
            )
            if variant_sku:
                qs = qs.filter(variant__sku=variant_sku)
            else:
                qs = qs.filter(variant__isnull=True)
            return qs.first()
        return None

    def before_import_row(self, row, **kwargs):
        super().before_import_row(row, **kwargs)

        # 1. Catalog flexible lookup
        catalog_val = row.get("catalog_code") or row.get("catalog_name") or row.get("catalog")
        if catalog_val:
            cat_obj = Catalog.objects.filter(
                models.Q(code=catalog_val) | models.Q(name=catalog_val)
            ).first()
            if cat_obj:
                row["catalog"] = cat_obj.code

        # 2. Product flexible lookup (by SKU or Name)
        prod_val = (
            row.get("product_sku")
            or row.get("product_name")
            or row.get("item_sku")
            or row.get("item_name")
            or row.get("product")
            or row.get("item")
        )
        if prod_val:
            prod_obj = Product.objects.filter(
                models.Q(sku=prod_val) | models.Q(name=prod_val)
            ).first()
            if prod_obj:
                row["product"] = prod_obj.sku

        # 3. Variant flexible lookup
        var_val = row.get("variant_sku") or row.get("variant_name") or row.get("variant")
        if var_val:
            var_obj = ProductVariant.objects.filter(
                models.Q(sku=var_val) | models.Q(barcode=var_val)
            ).first()
            if var_obj:
                row["variant"] = var_obj.sku

    class Meta(BasePlatformModelResource.Meta):
        model = CatalogItem
        import_id_fields = ("catalog", "product")
        fields = (
            "id",
            "catalog",
            "product",
            "variant",
            "override_name",
            "override_price",
            "is_new_arrival",
            "is_budget_friendly",
            "tags",
            "is_published",
            "sort_order",
        )


class CatalogCollectionResource(BasePlatformModelResource):
    catalog = fields.Field(
        column_name="catalog_code",
        attribute="catalog",
        widget=widgets.ForeignKeyWidget(Catalog, field="code"),
    )

    class Meta(BasePlatformModelResource.Meta):
        model = CatalogCollection
        import_id_fields = ("slug",)
        fields = (
            "id",
            "catalog",
            "name",
            "slug",
            "collection_type",
            "max_budget_price",
            "is_active",
        )


class CombinedItemCatalogResource(CatalogItemResource):
    """
    Combined Single-File XLSX / CSV Resource.
    Processes rows containing prefixed or non-prefixed fields for Category, Brand, Product, Catalog, and CatalogItem.
    Executes get_or_create / update for parent entities on-the-fly before upserting CatalogItem.
    """

    def before_import_row(self, row, **kwargs):
        # 1. On-the-fly Category resolution/creation
        category_slug = row.get("definition:category:slug") or row.get("category_slug")
        category_name = row.get("definition:category:name") or row.get("category_name")
        category_obj = None
        if category_slug or category_name:
            c_slug = category_slug or (
                category_name.lower().replace(" ", "-") if category_name else "default"
            )
            c_name = category_name or c_slug.replace("-", " ").title()
            category_obj, _ = Category.objects.get_or_create(slug=c_slug, defaults={"name": c_name})

        # 2. On-the-fly Brand resolution/creation
        brand_name = row.get("definition:brand:name") or row.get("brand_name")
        brand_obj = None
        if brand_name:
            brand_obj, _ = Brand.objects.get_or_create(name=brand_name)

        # 3. On-the-fly Product resolution/creation
        sku = (
            row.get("product")
            or row.get("master:product:sku")
            or row.get("item:sku")
            or row.get("product_sku")
            or row.get("sku")
        )
        name = (
            row.get("item_name")
            or row.get("master:product:name")
            or row.get("item:name")
            or row.get("product_name")
            or row.get("name")
        )
        price = (
            row.get("item_price")
            or row.get("master:product:price")
            or row.get("item:price")
            or row.get("price")
            or 0.0
        )

        if sku or name:
            p_sku = sku or (name.upper().replace(" ", "-") if name else "PROD-ITEM")
            p_name = name or p_sku
            product_obj, created = Product.objects.get_or_create(
                sku=p_sku,
                defaults={
                    "name": p_name,
                    "price": price,
                    "category": category_obj,
                    "brand": brand_obj,
                },
            )
            if not created and (name or price or category_obj or brand_obj):
                if name:
                    product_obj.name = name
                if price:
                    product_obj.price = price
                if category_obj:
                    product_obj.category = category_obj
                if brand_obj:
                    product_obj.brand = brand_obj
                product_obj.save()
            row["product"] = product_obj.sku

        # 4. On-the-fly Catalog resolution/creation
        catalog_code = (
            row.get("catalog")
            or row.get("catalog:catalog:code")
            or row.get("catalog_code")
            or "MAIN"
        )
        catalog_name = (
            row.get("catalog_name")
            or row.get("catalog:catalog:name")
            or catalog_code.replace("_", " ").title()
        )
        catalog_obj, _ = Catalog.objects.get_or_create(
            code=catalog_code, defaults={"name": catalog_name}
        )
        row["catalog"] = catalog_obj.code

        # 5. Extract CatalogItem presentation overrides
        if "catalog_item:override_name" in row:
            row["override_name"] = row["catalog_item:override_name"]
        if "catalog_item:override_price" in row:
            row["override_price"] = row["catalog_item:override_price"]
        if "catalog_item:is_new_arrival" in row:
            row["is_new_arrival"] = row["catalog_item:is_new_arrival"]
        if "catalog_item:is_budget_friendly" in row:
            row["is_budget_friendly"] = row["catalog_item:is_budget_friendly"]
        if "catalog_item:tags" in row:
            row["tags"] = row["catalog_item:tags"]

        super().before_import_row(row, **kwargs)
