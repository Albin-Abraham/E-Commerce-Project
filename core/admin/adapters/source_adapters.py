# core/admin/adapters/source_adapters.py
import csv
import hashlib
import io
import json
from abc import ABC, abstractmethod
from collections.abc import Iterator
from dataclasses import dataclass, field
from typing import Any


@dataclass
class NormalizedDomainRecord:
    """
    Standardized payload record produced by Source Adapters.
    Decouples raw vendor/file formats from canonical E-Commerce domain models.
    """

    row_number: int
    target_model: str
    raw_data: dict[str, Any]
    normalized_fields: dict[str, Any] = field(default_factory=dict)
    idempotency_key: str = ""
    errors: list[str] = field(default_factory=list)

    @property
    def is_valid(self) -> bool:
        return len(self.errors) == 0


class BaseSourceAdapter(ABC):
    """
    Abstract Source Adapter Contract.
    Converts heterogeneous data transport streams into standardized NormalizedDomainRecords.
    """

    KNOWN_PREFIXES = (
        "definition:category:",
        "definition:brand:",
        "definition:tag:",
        "definition:",
        "policy:pricing:",
        "policy:",
        "master:product:",
        "master:variant:",
        "master:",
        "item:",
        "product:",
        "variant:",
        "catalog:catalog:",
        "catalog:item:",
        "catalog:",
        "catalog_item:",
        "operational:order:",
        "operational:customer:",
        "operational:",
    )

    def __init__(self, source_type: str = "GENERIC", target_model: str = "product"):
        self.source_type = source_type
        self.target_model = target_model

    def strip_namespace(self, col_name: str) -> str:
        clean = col_name.strip()
        for prefix in self.KNOWN_PREFIXES:
            if clean.lower().startswith(prefix):
                return clean[len(prefix) :]
        return clean

    @abstractmethod
    def read_records(self, content_or_stream: Any) -> Iterator[NormalizedDomainRecord]:
        """Reads source stream in bounded chunks and yields NormalizedDomainRecords."""
        pass

    def calculate_idempotency_hash(self, record: NormalizedDomainRecord) -> str:
        """
        Computes a deterministic SHA-256 idempotency hash over target_model + normalized fields.
        Used for deduplication and duplicate detection across ingestion runs.
        """
        sorted_fields = json.dumps(
            {"target": record.target_model, "payload": record.normalized_fields},
            sort_keys=True,
            default=str,
        )
        return hashlib.sha256(sorted_fields.encode("utf-8")).hexdigest()


class CSVStreamingAdapter(BaseSourceAdapter):
    """
    Streaming CSV Source Adapter.
    Processes CSV streams row by row with bounded memory footprint.
    """

    def __init__(self, target_model: str = "product", field_mappings: dict[str, str] | None = None):
        super().__init__(source_type="CSV", target_model=target_model)
        self.field_mappings = field_mappings or {}

    def read_records(self, raw_csv_content: str) -> Iterator[NormalizedDomainRecord]:
        stream = io.StringIO(raw_csv_content)
        reader = csv.DictReader(stream)

        for row_idx, row in enumerate(reader, start=1):
            raw_data = dict(row)
            normalized = {}

            # Map raw CSV column headers to canonical domain field names
            for col_name, val in raw_data.items():
                if not col_name:
                    continue
                col_clean = col_name.strip()
                domain_field = self.field_mappings.get(col_clean, self.strip_namespace(col_clean))
                val_clean = val.strip() if isinstance(val, str) else val
                normalized[domain_field] = val_clean
                normalized[col_clean] = val_clean

            rec = NormalizedDomainRecord(
                row_number=row_idx,
                target_model=self.target_model,
                raw_data=raw_data,
                normalized_fields=normalized,
            )
            rec.idempotency_key = self.calculate_idempotency_hash(rec)
            yield rec


class XLSXReadOnlyAdapter(BaseSourceAdapter):
    """
    Read-Only Worksheet Source Adapter for Vendor Excel Catalogs.
    Iterates over tabular rows with minimal RAM accumulation.
    """

    def __init__(self, target_model: str = "product", field_mappings: dict[str, str] | None = None):
        super().__init__(source_type="XLSX", target_model=target_model)
        self.field_mappings = field_mappings or {}

    def read_records(self, rows_list: list[dict[str, Any]]) -> Iterator[NormalizedDomainRecord]:
        for row_idx, raw_data in enumerate(rows_list, start=1):
            normalized = {}
            for col_name, val in raw_data.items():
                if not col_name:
                    continue
                col_clean = col_name.strip()
                domain_field = self.field_mappings.get(col_clean, self.strip_namespace(col_clean))
                val_clean = str(val).strip() if val is not None else ""
                normalized[domain_field] = val_clean
                normalized[col_clean] = val_clean

            rec = NormalizedDomainRecord(
                row_number=row_idx,
                target_model=self.target_model,
                raw_data=raw_data,
                normalized_fields=normalized,
            )
            rec.idempotency_key = self.calculate_idempotency_hash(rec)
            yield rec


class JSONStreamingAdapter(BaseSourceAdapter):
    """
    JSON Array / Event Payload Source Adapter.
    Yields normalized domain records from structured API or message payloads.
    """

    def __init__(self, target_model: str = "product"):
        super().__init__(source_type="JSON", target_model=target_model)

    def read_records(self, payload_list: list[dict[str, Any]]) -> Iterator[NormalizedDomainRecord]:
        for row_idx, raw_data in enumerate(payload_list, start=1):
            rec = NormalizedDomainRecord(
                row_number=row_idx,
                target_model=self.target_model,
                raw_data=raw_data,
                normalized_fields=dict(raw_data),
            )
            rec.idempotency_key = self.calculate_idempotency_hash(rec)
            yield rec


class ERPInventorySyncAdapter(BaseSourceAdapter):
    """
    Realtime ERP / POS Inventory Sync Source Adapter.
    Translates external ERP stock event payloads into canonical platform Inventory fields.
    """

    def __init__(self):
        super().__init__(source_type="ERP_SYNC", target_model="inventory")

    def read_records(self, erp_payloads: list[dict[str, Any]]) -> Iterator[NormalizedDomainRecord]:
        for row_idx, raw in enumerate(erp_payloads, start=1):
            normalized = {
                "sku": raw.get("item_sku") or raw.get("sku"),
                "facility_code": raw.get("whs_code") or raw.get("warehouse"),
                "available_stock": raw.get("stock_qty", 0),
                "reorder_level": raw.get("min_qty", 0),
            }
            rec = NormalizedDomainRecord(
                row_number=row_idx,
                target_model=self.target_model,
                raw_data=raw,
                normalized_fields=normalized,
            )
            rec.idempotency_key = self.calculate_idempotency_hash(rec)
            yield rec
