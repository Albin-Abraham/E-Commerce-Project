import tablib
from typing import Dict, Any, List
from django.db import transaction
from django.utils import timezone

from core.admin.models.import_engine import ImportPackage, ImportPackageItem
from apps.shop.infrastructure.resources.shop_resources import (
    CategoryResource,
    BrandResource,
    ProductResource,
    ProductVariantResource,
    CatalogResource,
    TagDefinitionResource,
    CatalogItemResource,
    CatalogCollectionResource,
    CombinedItemCatalogResource,
)
from apps.customers.resources.customer_resources import CustomerResource


class ImportPipelineService:
    """
    Multi-Tier Data Onboarding & Import Pipeline Service.
    Orchestrates multi-file package ingestion using SOLID django-import-export resources.
    Enforces strict DAG sequence: DEFINITION -> POLICY -> MASTER -> CATALOG -> OPERATIONAL.
    """

    RESOURCE_MAP = {
        "category": CategoryResource,
        "brand": BrandResource,
        "product": ProductResource,
        "variant": ProductVariantResource,
        "customer": CustomerResource,
        "catalog": CatalogResource,
        "tag_definition": TagDefinitionResource,
        "catalog_item": CatalogItemResource,
        "catalog_collection": CatalogCollectionResource,
        "combined_item_catalog": CombinedItemCatalogResource,
    }

    TIER_SEQUENCE = [
        ImportPackageItem.Tier.DEFINITION,
        ImportPackageItem.Tier.POLICY,
        ImportPackageItem.Tier.MASTER,
        ImportPackageItem.Tier.CATALOG,
        ImportPackageItem.Tier.OPERATIONAL,
    ]

    class _DryRunRollback(Exception):
        pass

    @classmethod
    def process_package(
        cls,
        package: ImportPackage,
        package_files: Dict[str, str], # file_key -> raw_csv_or_json_content
        dry_run: bool = True,
        user = None,
    ) -> Dict[str, Any]:
        """
        Processes a multi-file ImportPackage in DAG tier sequence.
        """
        def _execute_ingestion():
            package.status = ImportPackage.ImportStatus.VALIDATING if dry_run else ImportPackage.ImportStatus.PUBLISHING
            package.save()

            total_rows = 0
            valid_rows = 0
            error_count = 0
            item_reports = []

            # Process in explicit DAG tier order
            for tier in cls.TIER_SEQUENCE:
                tier_items = package.items.filter(tier=tier).order_by("sequence_order")
                for item in tier_items:
                    raw_content = package_files.get(item.file_name)
                    if not raw_content:
                        item.status = "SKIPPED_MISSING_FILE"
                        item.save()
                        continue

                    resource_cls = cls.RESOURCE_MAP.get(item.target_model.lower())
                    if not resource_cls:
                        item.status = "UNSUPPORTED_MODEL"
                        item.save()
                        continue

                    # Parse CSV content using tablib
                    dataset = tablib.Dataset()
                    dataset.load(raw_content, format="csv")

                    resource = resource_cls()
                    result = resource.import_data(
                        dataset,
                        dry_run=False,
                        raise_errors=False,
                        user=user,
                        source_import_id=str(package.id),
                        source_file=item.file_name,
                    )

                    item_valid = 0
                    item_errors = 0
                    item_error_details = []

                    for row_number, row_res in enumerate(result.rows, start=1):
                        if row_res.errors:
                            item_errors += 1
                            for err in row_res.errors:
                                item_error_details.append({
                                    "row": row_number,
                                    "error": str(err.error),
                                })
                        else:
                            item_valid += 1

                    item.row_count = len(dataset)
                    item.valid_rows = item_valid
                    item.error_count = item_errors
                    item.error_details = item_error_details
                    item.status = "VALIDATED" if (dry_run and item_errors == 0) else ("PUBLISHED" if not dry_run and item_errors == 0 else "FAILED")
                    item.save()

                    total_rows += len(dataset)
                    valid_rows += item_valid
                    error_count += item_errors

                    item_reports.append({
                        "file_name": item.file_name,
                        "target_model": item.target_model,
                        "rows": len(dataset),
                        "valid": item_valid,
                        "errors": item_errors,
                    })

            package.total_rows = total_rows
            package.valid_rows = valid_rows
            package.error_count = error_count

            if error_count > 0:
                package.status = ImportPackage.ImportStatus.VALIDATION_FAILED if dry_run else ImportPackage.ImportStatus.IMPORT_FAILED
            else:
                package.status = ImportPackage.ImportStatus.STAGED if dry_run else ImportPackage.ImportStatus.PUBLISHED
                if not dry_run:
                    package.executed_at = timezone.now()

            package.save()

            return {
                "package_id": str(package.id),
                "status": package.status,
                "dry_run": dry_run,
                "total_rows": total_rows,
                "valid_rows": valid_rows,
                "error_count": error_count,
                "items": item_reports,
            }

        if dry_run:
            try:
                with transaction.atomic():
                    res = _execute_ingestion()
                    raise cls._DryRunRollback()
            except cls._DryRunRollback:
                pass
            package.refresh_from_db()
            return res
        else:
            with transaction.atomic():
                return _execute_ingestion()
