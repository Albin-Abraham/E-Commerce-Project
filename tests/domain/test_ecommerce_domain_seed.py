import pytest
from django.core.management import call_command

from apps.shop.infrastructure.models.brand import Brand
from apps.shop.infrastructure.models.category import Category
from apps.shop.infrastructure.models.inventory import Inventory
from apps.shop.infrastructure.models.product import Product
from apps.shop.infrastructure.models.variant import ProductVariant
from apps.shop.infrastructure.models.warehouse import Warehouse
from core.base_models.seed_data.domains.ecommerce.seed import EcommerceSeedRunner
from core.base_models.seed_data.engine.context import SeedContext


@pytest.mark.django_db
def test_ecommerce_domain_seed_validation():
    runner = EcommerceSeedRunner()
    context = SeedContext(validate_only=True)
    stats = runner.run(context)
    assert len(stats.errors) == 0


@pytest.mark.django_db
def test_ecommerce_domain_seed_dry_run():
    initial_product_count = Product.objects.count()
    runner = EcommerceSeedRunner()
    context = SeedContext(dry_run=True)
    stats = runner.run(context)

    # In dry-run, stats record simulated actions, but DB is rolled back
    assert len(stats.errors) == 0
    assert Product.objects.count() == initial_product_count


@pytest.mark.django_db
def test_ecommerce_domain_seed_execution_and_idempotency():
    call_command("seeds_data", domain="ecommerce")

    # Assert entities created
    assert Brand.objects.filter(slug="apex-electronics").exists()
    assert Category.objects.filter(slug="computers-laptops").exists()
    assert Product.objects.filter(sku="PROD-APX-LAPTOP-15").exists()
    assert ProductVariant.objects.filter(sku="VAR-APX-LAP-15-SLV-512").exists()
    assert Warehouse.objects.filter(code="WH-CENTRAL-01").exists()
    assert Inventory.objects.filter(warehouse__code="WH-CENTRAL-01").exists()

    # Re-run and assert zero errors (idempotency)
    call_command("seeds_data", domain="ecommerce")
    assert Product.objects.filter(sku="PROD-APX-LAPTOP-15").count() == 1
