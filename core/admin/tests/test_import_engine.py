import pytest
from decimal import Decimal
from rest_framework.test import APIRequestFactory, force_authenticate

from apps.shop.infrastructure.models.category import Category
from apps.shop.infrastructure.models.brand import Brand
from apps.shop.infrastructure.models.product import Product
from apps.shop.infrastructure.resources.shop_resources import (
    CategoryResource,
    BrandResource,
    ProductResource,
)
from core.admin.models.import_engine import ImportPackage, ImportPackageItem
from core.admin.services.import_pipeline_service import ImportPipelineService
from tests.factories.user import UserFactory


@pytest.mark.django_db
class TestImportEngineResources:
    def test_category_import_resource(self):
        csv_data = "name,slug,parent_slug\nElectronics,electronics,\nSmartphones,smartphones,electronics"
        import tablib
        dataset = tablib.Dataset().load(csv_data, format="csv")

        resource = CategoryResource()
        result = resource.import_data(dataset, dry_run=False)

        assert not result.has_errors()
        assert Category.objects.filter(slug="electronics").exists()
        child = Category.objects.get(slug="smartphones")
        assert child.parent.slug == "electronics"

    def test_brand_and_product_import_with_natural_keys(self):
        Category.objects.create(name="Audio", slug="audio")
        Brand.objects.create(name="Sony", slug="sony")

        csv_data = (
            "sku,name,price,category_slug,brand_name,status\n"
            "WH1000XM4,Noise Canceling Headphones,349.99,audio,Sony,ACTIVE"
        )
        import tablib
        dataset = tablib.Dataset().load(csv_data, format="csv")

        resource = ProductResource()
        result = resource.import_data(dataset, dry_run=False, source_import_id="TEST-001", source_file="products.csv")

        assert not result.has_errors()
        prod = Product.objects.get(sku="WH1000XM4")
        assert prod.name == "Noise Canceling Headphones"
        assert prod.category.slug == "audio"
        assert prod.brand.name == "Sony"
        # Verify lineage metadata captured by AuditLineageResourceMixin
        assert prod.metadata["_import_lineage"]["source_import_id"] == "TEST-001"
        assert prod.metadata["_import_lineage"]["source_file"] == "products.csv"

    def test_idempotent_upsert(self):
        Brand.objects.create(name="Apple", slug="apple")

        csv_data = "name,slug,website\nApple,apple,https://apple.com"
        import tablib
        dataset = tablib.Dataset().load(csv_data, format="csv")

        resource = BrandResource()
        # First import: updates existing Brand record by natural key 'name'
        res1 = resource.import_data(dataset, dry_run=False)
        assert not res1.has_errors()
        assert Brand.objects.count() == 1
        brand = Brand.objects.get(name="Apple")
        assert brand.website == "https://apple.com"


    def test_namespaced_headers_import(self):
        Category.objects.create(name="Footwear", slug="footwear")

        csv_data = (
            "master:product:sku,item:name,item:price,definition:category:slug,status\n"
            "RUN-SHOE-001,Pro Running Shoes,129.99,footwear,ACTIVE"
        )
        import tablib
        dataset = tablib.Dataset().load(csv_data, format="csv")

        resource = ProductResource()
        result = resource.import_data(dataset, dry_run=False)

        assert not result.has_errors()
        prod = Product.objects.get(sku="RUN-SHOE-001")
        assert prod.name == "Pro Running Shoes"
        assert prod.category.slug == "footwear"

    def test_catalog_item_resource_import(self):
        from apps.shop.infrastructure.models.catalog import Catalog, CatalogItem
        from apps.shop.infrastructure.resources.shop_resources import CatalogItemResource

        cat = Catalog.objects.create(code="SUMMER_2026", name="Summer 2026 Storefront")
        prod = Product.objects.create(sku="SUN-GLASSES-01", name="Polarized Sunglasses", price=50.00)

        csv_data = (
            "catalog_code,product_sku,override_name,override_price,is_new_arrival,is_budget_friendly\n"
            "SUMMER_2026,SUN-GLASSES-01,Summer Polarized Shades,39.99,True,True"
        )
        import tablib
        dataset = tablib.Dataset().load(csv_data, format="csv")

        resource = CatalogItemResource()
        result = resource.import_data(dataset, dry_run=False)

        assert not result.has_errors()
        ci = CatalogItem.objects.get(catalog=cat, product=prod)
        assert ci.override_name == "Summer Polarized Shades"
        assert ci.override_price == Decimal("39.99")
        assert ci.is_new_arrival is True
        assert ci.is_budget_friendly is True

    def test_combined_item_catalog_resource_import(self):
        from apps.shop.infrastructure.models.catalog import Catalog, CatalogItem
        from apps.shop.infrastructure.resources.shop_resources import CombinedItemCatalogResource

        csv_data = (
            "definition:category:slug,definition:category:name,definition:brand:name,item:sku,item:name,item:price,catalog:catalog:code,catalog_item:override_name,catalog_item:is_new_arrival,catalog_item:is_budget_friendly\n"
            "apparel,Apparel & Fashion,Nike,NK-TEE-01,Nike Air Tee,35.00,MAIN_STORE,Nike Air Graphic Tee,True,True"
        )
        import tablib
        dataset = tablib.Dataset().load(csv_data, format="csv")

        resource = CombinedItemCatalogResource()
        result = resource.import_data(dataset, dry_run=False)

        assert not result.has_errors()
        prod = Product.objects.get(sku="NK-TEE-01")
        assert prod.name == "Nike Air Tee"
        assert prod.category.slug == "apparel"
        assert prod.brand.name == "Nike"

        cat = Catalog.objects.get(code="MAIN_STORE")
        ci = CatalogItem.objects.get(catalog=cat, product=prod)
        assert ci.override_name == "Nike Air Graphic Tee"
        assert ci.is_new_arrival is True
        assert ci.is_budget_friendly is True


@pytest.mark.django_db
class TestImportPipelineService:
    def test_multi_tier_package_processing(self):
        package = ImportPackage.objects.create(
            package_name="Retail Master Ingestion",
            package_version="1.0",
        )
        item1 = ImportPackageItem.objects.create(
            package=package,
            file_name="categories.csv",
            target_model="category",
            tier=ImportPackageItem.Tier.MASTER,
            sequence_order=1,
        )
        item2 = ImportPackageItem.objects.create(
            package=package,
            file_name="products.csv",
            target_model="product",
            tier=ImportPackageItem.Tier.MASTER,
            sequence_order=2,
        )

        files = {
            "categories.csv": "name,slug,parent_slug\nGaming,gaming,",
            "products.csv": "sku,name,price,category_slug,brand_name,status\nPS5,PlayStation 5,499.99,gaming,,ACTIVE",
        }

        # 1. Dry run validation
        res_dry = ImportPipelineService.process_package(package, package_files=files, dry_run=True)
        assert res_dry["status"] == ImportPackage.ImportStatus.STAGED
        assert res_dry["error_count"] == 0

        # 2. Publish import
        res_publish = ImportPipelineService.process_package(package, package_files=files, dry_run=False)
        assert res_publish["status"] == ImportPackage.ImportStatus.PUBLISHED
        assert Product.objects.filter(sku="PS5").exists()
        prod = Product.objects.get(sku="PS5")
        assert prod.category.slug == "gaming"
