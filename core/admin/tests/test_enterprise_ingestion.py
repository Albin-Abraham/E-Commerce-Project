import pytest

from apps.shop.infrastructure.models.category import Category
from apps.shop.infrastructure.models.product import Product
from core.admin.adapters.source_adapters import (
    CSVStreamingAdapter,
    ERPInventorySyncAdapter,
    XLSXReadOnlyAdapter,
)
from core.admin.models.import_engine import (
    ImportJob,
    ImportPackage,
    ImportPackageItem,
    StagingRecord,
)
from core.admin.services.ingestion_engine_service import EnterpriseIngestionService


@pytest.mark.django_db
class TestSourceAdapters:
    def test_csv_source_adapter_streaming(self):
        csv_data = "sku,name,price,category_slug\nTECH-001,Laptop Pro,1299.99,electronics\nTECH-002,Tablet Air,699.99,electronics"
        adapter = CSVStreamingAdapter(target_model="product")

        records = list(adapter.read_records(csv_data))
        assert len(records) == 2

        rec1 = records[0]
        assert rec1.row_number == 1
        assert rec1.target_model == "product"
        assert rec1.normalized_fields["sku"] == "TECH-001"
        assert rec1.normalized_fields["name"] == "Laptop Pro"
        assert len(rec1.idempotency_key) == 64

    def test_xlsx_source_adapter_read_only(self):
        rows = [
            {"sku": "VEND-100", "name": "Vendor Chair", "price": "199.00"},
            {"sku": "VEND-101", "name": "Vendor Desk", "price": "399.00"},
        ]
        adapter = XLSXReadOnlyAdapter(target_model="product")
        records = list(adapter.read_records(rows))

        assert len(records) == 2
        assert records[0].normalized_fields["sku"] == "VEND-100"
        assert records[1].normalized_fields["name"] == "Vendor Desk"

    def test_erp_inventory_sync_adapter(self):
        payloads = [{"item_sku": "SKU-99", "whs_code": "WHS-MAIN", "stock_qty": 150, "min_qty": 10}]
        adapter = ERPInventorySyncAdapter()
        records = list(adapter.read_records(payloads))

        assert len(records) == 1
        rec = records[0]
        assert rec.target_model == "inventory"
        assert rec.normalized_fields["sku"] == "SKU-99"
        assert rec.normalized_fields["facility_code"] == "WHS-MAIN"
        assert rec.normalized_fields["available_stock"] == 150


@pytest.mark.django_db
class TestEnterpriseIngestionService:
    def test_enterprise_ingestion_service_dry_run(self):
        Category.objects.create(name="Audio", slug="audio")

        package = ImportPackage.objects.create(
            package_name="Supplier Audio Ingestion",
            package_version="1.0",
        )
        item = ImportPackageItem.objects.create(
            package=package,
            file_name="audio_products.csv",
            target_model="product",
            tier=ImportPackageItem.Tier.MASTER,
        )

        csv_data = "sku,name,price,category_slug\nHEADPHONE-1,Wireless Headphone,149.99,audio"
        adapter = CSVStreamingAdapter(target_model="product")

        # Execute Dry Run Ingestion
        res = EnterpriseIngestionService.ingest_package_stream(
            package=package,
            package_item=item,
            raw_content=csv_data,
            adapter=adapter,
            batch_size=10,
            dry_run=True,
        )

        assert res["status"] == ImportPackage.ImportStatus.STAGED
        assert res["accepted_rows"] == 1
        assert res["error_rows"] == 0

        # Verify domain product was NOT committed to DB on dry run
        assert not Product.objects.filter(sku="HEADPHONE-1").exists()

    def test_enterprise_ingestion_service_publish_and_idempotency(self):
        Category.objects.create(name="Gaming", slug="gaming")

        package = ImportPackage.objects.create(
            package_name="Console Inventory Ingestion",
            package_version="1.0",
        )
        item = ImportPackageItem.objects.create(
            package=package,
            file_name="consoles.csv",
            target_model="product",
            tier=ImportPackageItem.Tier.MASTER,
        )

        csv_data = "sku,name,price,category_slug\nCONSOLE-X,NextGen Console,499.99,gaming"
        adapter = CSVStreamingAdapter(target_model="product")

        # 1. Execute Publish Ingestion
        res1 = EnterpriseIngestionService.ingest_package_stream(
            package=package,
            package_item=item,
            raw_content=csv_data,
            adapter=adapter,
            dry_run=False,
        )

        assert res1["status"] == ImportPackage.ImportStatus.COMPLETED
        assert res1["accepted_rows"] == 1

        # Verify product created in DB with lineage metadata
        prod = Product.objects.get(sku="CONSOLE-X")
        assert prod.name == "NextGen Console"
        assert prod.category.slug == "gaming"
        assert prod.metadata["_import_lineage"]["source_import_id"] == str(package.id)

        # 2. Execute duplicate ingestion run to test Idempotency Hash Deduplication
        pkg2 = ImportPackage.objects.create(package_name="Duplicate Run", package_version="1.0")
        item2 = ImportPackageItem.objects.create(
            package=pkg2, file_name="consoles.csv", target_model="product"
        )

        res2 = EnterpriseIngestionService.ingest_package_stream(
            package=pkg2,
            package_item=item2,
            raw_content=csv_data,
            adapter=adapter,
            dry_run=False,
        )

        assert res2["duplicate_rows"] == 1
        assert res2["rejected_rows"] == 1
        assert Product.objects.filter(sku="CONSOLE-X").count() == 1

    def test_standalone_import_job_stream(self):
        Category.objects.create(name="Home", slug="home")

        job = ImportJob.objects.create(
            job_name="Direct UI Product Upload",
            target_model="product",
            source_type="CSV",
            file_name="products.csv",
        )

        csv_data = "sku,name,price,category_slug\nSOFA-01,Comfort Sofa,899.99,home"
        adapter = CSVStreamingAdapter(target_model="product")

        res = EnterpriseIngestionService.ingest_job_stream(
            job=job,
            raw_content=csv_data,
            adapter=adapter,
            dry_run=False,
        )

        assert res["job_id"] == str(job.id)
        assert res["status"] == ImportJob.ImportStatus.COMPLETED
        assert res["accepted_rows"] == 1
        assert Product.objects.filter(sku="SOFA-01").exists()

        # Verify StagingRecord link to ImportJob
        stg = StagingRecord.objects.get(job=job)
        assert stg.target_model == "product"
        assert stg.status == StagingRecord.RecordStatus.COMMITTED
