# core/admin/services/ingestion_engine_service.py
import time
from typing import Any

from django.db import transaction
from django.utils import timezone

from core.admin.adapters.source_adapters import BaseSourceAdapter, NormalizedDomainRecord
from core.admin.models.import_engine import (
    ImportJob,
    ImportPackage,
    ImportPackageItem,
    StagingRecord,
)


class EnterpriseIngestionService:
    """
    Enterprise Data Ingestion & Integration Engine Service.
    Orchestrates bounded streaming ingestion, Staging persistence, SHA-256 Idempotency checks,
    Domain model reconciliation, and state machine lifecycle metrics via canonical ImportJob instances.
    """

    @classmethod
    def get_domain_model(cls, target_model_key: str) -> type | None:
        from django.apps import apps

        mapping = {
            "category": ("shop", "Category"),
            "brand": ("shop", "Brand"),
            "product": ("shop", "Product"),
            "variant": ("shop", "ProductVariant"),
        }
        target = mapping.get(target_model_key.lower())
        if target:
            try:
                return apps.get_model(target[0], target[1])
            except LookupError:
                pass
        return None

    @classmethod
    def ingest_job_stream(
        cls,
        job: ImportJob,
        raw_content: Any,
        adapter: BaseSourceAdapter,
        batch_size: int = 1000,
        dry_run: bool = True,
        user: Any = None,
    ) -> dict[str, Any]:
        """
        Executes bounded batch streaming ingestion for a single ImportJob using a Source Adapter.
        """
        start_time = time.time()

        job.status = ImportJob.ImportStatus.PARSING
        job.source_type = adapter.source_type
        job.save()

        target_model_key = job.target_model.lower()
        domain_model_cls = cls.get_domain_model(target_model_key)

        records_chunk: list[NormalizedDomainRecord] = []

        processed_count = 0
        accepted_count = 0
        rejected_count = 0
        duplicate_count = 0
        error_count = 0

        # Generator iterator from Source Adapter
        record_stream = adapter.read_records(raw_content)

        job.status = (
            ImportJob.ImportStatus.VALIDATING if dry_run else ImportJob.ImportStatus.PERSISTING
        )
        job.save()

        with transaction.atomic():
            for record in record_stream:
                processed_count += 1
                records_chunk.append(record)

                if len(records_chunk) >= batch_size:
                    chunk_res = cls._process_batch_chunk(
                        job=job,
                        package=job.package,
                        chunk=records_chunk,
                        domain_model_cls=domain_model_cls,
                        dry_run=dry_run,
                        user=user,
                    )
                    accepted_count += chunk_res["accepted"]
                    rejected_count += chunk_res["rejected"]
                    duplicate_count += chunk_res["duplicate"]
                    error_count += chunk_res["errors"]
                    records_chunk = []

            # Process final remaining chunk
            if records_chunk:
                chunk_res = cls._process_batch_chunk(
                    job=job,
                    package=job.package,
                    chunk=records_chunk,
                    domain_model_cls=domain_model_cls,
                    dry_run=dry_run,
                    user=user,
                )
                accepted_count += chunk_res["accepted"]
                rejected_count += chunk_res["rejected"]
                duplicate_count += chunk_res["duplicate"]
                error_count += chunk_res["errors"]

            if dry_run:
                transaction.set_rollback(True)

        elapsed = time.time() - start_time

        # Update job metrics
        job.total_rows = processed_count
        job.processed_rows = processed_count
        job.valid_rows = accepted_count
        job.accepted_rows = accepted_count
        job.rejected_rows = rejected_count
        job.duplicate_rows = duplicate_count
        job.error_rows = error_count
        job.duration_seconds = elapsed

        if dry_run:
            job.status = (
                ImportJob.ImportStatus.VALIDATION_FAILED
                if error_count > 0
                else ImportJob.ImportStatus.STAGED
            )
        else:
            if error_count == 0:
                job.status = ImportJob.ImportStatus.COMPLETED
                job.executed_at = timezone.now()
            elif accepted_count > 0:
                job.status = ImportJob.ImportStatus.PARTIAL
            else:
                job.status = ImportJob.ImportStatus.FAILED

        job.save()

        return {
            "job_id": str(job.id),
            "status": job.status,
            "dry_run": dry_run,
            "processed_rows": processed_count,
            "accepted_rows": accepted_count,
            "rejected_rows": rejected_count,
            "duplicate_rows": duplicate_count,
            "error_rows": error_count,
            "duration_seconds": round(elapsed, 4),
        }

    @classmethod
    def ingest_package_stream(
        cls,
        package: ImportPackage,
        package_item: ImportPackageItem,
        raw_content: Any,
        adapter: BaseSourceAdapter,
        batch_size: int = 1000,
        dry_run: bool = True,
        user: Any = None,
    ) -> dict[str, Any]:
        """
        Package wrapper executing streaming ingestion by binding to a child ImportJob.
        """
        job = ImportJob.objects.create(
            package=package,
            job_name=f"Ingest {package_item.file_name}",
            source_type=adapter.source_type,
            target_model=package_item.target_model,
            tier=package_item.tier,
            file_name=package_item.file_name,
        )

        res = cls.ingest_job_stream(
            job=job,
            raw_content=raw_content,
            adapter=adapter,
            batch_size=batch_size,
            dry_run=dry_run,
            user=user,
        )

        # Update package item & package aggregate metrics
        package_item.row_count = job.processed_rows
        package_item.valid_rows = job.accepted_rows
        package_item.error_count = job.error_rows
        package_item.status = (
            "VALIDATED"
            if (dry_run and job.error_rows == 0)
            else ("PUBLISHED" if not dry_run and job.error_rows == 0 else "FAILED")
        )
        package_item.save()

        package.source_type = adapter.source_type
        package.processed_rows += job.processed_rows
        package.valid_rows += job.accepted_rows
        package.accepted_rows += job.accepted_rows
        package.rejected_rows += job.rejected_rows
        package.duplicate_rows += job.duplicate_rows
        package.error_rows += job.error_rows
        package.error_count += job.error_rows
        package.duration_seconds += job.duration_seconds

        if dry_run:
            package.status = (
                ImportPackage.ImportStatus.VALIDATION_FAILED
                if job.error_rows > 0
                else ImportPackage.ImportStatus.STAGED
            )
        else:
            if job.error_rows == 0:
                package.status = ImportPackage.ImportStatus.COMPLETED
                package.executed_at = timezone.now()
            elif job.accepted_rows > 0:
                package.status = ImportPackage.ImportStatus.PARTIAL
            else:
                package.status = ImportPackage.ImportStatus.FAILED

        package.save()
        res["package_id"] = str(package.id)
        return res

    @classmethod
    def _process_batch_chunk(
        cls,
        job: ImportJob,
        package: ImportPackage | None,
        chunk: list[NormalizedDomainRecord],
        domain_model_cls: type | None,
        dry_run: bool,
        user: Any,
    ) -> dict[str, int]:
        accepted = 0
        rejected = 0
        duplicate = 0
        errors = 0

        now = timezone.now()
        staging_objs = []
        for rec in chunk:
            stg = StagingRecord(
                job=job,
                package=package,
                row_number=rec.row_number,
                target_model=rec.target_model,
                raw_payload=rec.raw_data,
                normalized_payload=rec.normalized_fields,
                status=StagingRecord.RecordStatus.RAW,
                idempotency_hash=rec.idempotency_key,
                created_at=now,
                updated_at=now,
            )
            staging_objs.append(stg)

        # Bulk insert staging records
        StagingRecord.objects.bulk_create(staging_objs)

        # Process each staging record for idempotency check & domain validation
        for stg, rec in zip(staging_objs, chunk):
            # 1. Idempotency & Deduplication Check
            existing_committed = (
                StagingRecord.objects.filter(
                    idempotency_hash=stg.idempotency_hash,
                    status=StagingRecord.RecordStatus.COMMITTED,
                )
                .exclude(pk=stg.pk)
                .exists()
            )

            if existing_committed:
                stg.status = StagingRecord.RecordStatus.REJECTED
                stg.error_details = ["Duplicate record identified via SHA-256 idempotency hash."]
                stg.save()
                duplicate += 1
                rejected += 1
                continue

            # 2. Domain Model Mapping & Validation
            if not domain_model_cls:
                stg.status = StagingRecord.RecordStatus.REJECTED
                stg.error_details = [f"Unsupported target domain model: {rec.target_model}"]
                stg.save()
                rejected += 1
                errors += 1
                continue

            try:
                # Instantiate domain entity from normalized fields
                instance = cls._instantiate_domain_model(domain_model_cls, rec.normalized_fields)

                if hasattr(instance, "full_clean"):
                    instance.full_clean()

                if not dry_run:
                    # Persist to domain table
                    if hasattr(instance, "metadata") and isinstance(instance.metadata, dict):
                        instance.metadata["_import_lineage"] = {
                            "source_job_id": str(job.id),
                            "source_import_id": str(package.id) if package else str(job.id),
                            "source_staging_id": str(stg.id),
                            "source_file": job.file_name,
                            "source_row": rec.row_number,
                            "imported_at": timezone.now().isoformat(),
                        }
                    instance.save()
                    stg.status = StagingRecord.RecordStatus.COMMITTED
                else:
                    stg.status = StagingRecord.RecordStatus.VALIDATED

                stg.save()
                accepted += 1

            except Exception as exc:
                stg.status = StagingRecord.RecordStatus.REJECTED
                stg.error_details = [str(exc)]
                stg.save()
                rejected += 1
                errors += 1

        return {
            "accepted": accepted,
            "rejected": rejected,
            "duplicate": duplicate,
            "errors": errors,
        }

    @classmethod
    def _instantiate_domain_model(cls, model_cls: type, fields_dict: dict[str, Any]):
        """Helper to instantiate domain model by matching fields and handling ForeignKeys."""
        kwargs = {}
        model_fields = {f.name: f for f in model_cls._meta.get_fields()}

        for k, v in fields_dict.items():
            target_field_name = k
            if k not in model_fields:
                if k.endswith("_slug") or k.endswith("_name") or k.endswith("_id"):
                    candidate = k.rsplit("_", 1)[0]
                    if candidate in model_fields:
                        target_field_name = candidate

            if target_field_name in model_fields:
                field_obj = model_fields[target_field_name]
                if field_obj.is_relation and field_obj.many_to_one:
                    rel_model = field_obj.related_model
                    rel_obj = None
                    if "slug" in [f.name for f in rel_model._meta.get_fields()]:
                        rel_obj = rel_model.objects.filter(slug=v).first()
                    if not rel_obj and "name" in [f.name for f in rel_model._meta.get_fields()]:
                        rel_obj = rel_model.objects.filter(name=v).first()
                    kwargs[target_field_name] = rel_obj
                else:
                    kwargs[target_field_name] = v

        return model_cls(**kwargs)
