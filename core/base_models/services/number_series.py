from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
import re

from django.db import transaction
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

# Lazy imports inside methods to comply with DAG import rules


class NumberSeriesRegistry:
    """
    Centralized registry for document types that use number series.
    Allows modular registration of new document types across the system.
    """

    _ALWAYS_VARIABLES: tuple[str, ...] = (
        "{SEQ}",
        "{SEQ:n}",
        "{COMPANY_CODE}",
        "{BU_CODE}",
        "{BRANCH_CODE}",
    )

    _registry: dict[str, dict] = {
        "purchase_request": {
            "label": _("Purchase Request"),
            "default_pattern": "PR-{YYYY}-{SEQ:5}",
            "allowed_reset_policies": ["NEVER", "YEARLY", "MONTHLY", "DAILY"],
            "field_name": "request_number",
        },
        "rfq": {
            "label": _("RFQ"),
            "default_pattern": "RFQ-{YYYY}-{SEQ:5}",
            "allowed_reset_policies": ["NEVER", "YEARLY", "MONTHLY", "DAILY"],
            "field_name": "rfq_number",
        },
        "purchase_order": {
            "label": _("Purchase Order"),
            "default_pattern": "PO-{YYYY}-{SEQ:5}",
            "allowed_reset_policies": ["NEVER", "YEARLY", "MONTHLY", "DAILY"],
            "field_name": "po_number",
        },
        "grn": {
            "label": _("GRN"),
            "default_pattern": "GRN-{YYYY}-{SEQ:5}",
            "allowed_reset_policies": ["NEVER", "YEARLY", "MONTHLY", "DAILY"],
            "field_name": "grn_number",
        },
        "purchase_invoice": {
            "label": _("Purchase Invoice"),
            "default_pattern": "PI-{YYYY}-{SEQ:5}",
            "allowed_reset_policies": ["NEVER", "YEARLY", "MONTHLY", "DAILY"],
            "field_name": "invoice_number",
        },
        "sales_order": {
            "label": _("Sales Order"),
            "default_pattern": "SO-{YYYY}-{SEQ:5}",
            "allowed_reset_policies": ["NEVER", "YEARLY", "MONTHLY", "DAILY"],
            "field_name": "order_number",
        },
        "sales_invoice": {
            "label": _("Sales Invoice"),
            "default_pattern": "INV-{YYYY}-{SEQ:5}",
            "allowed_reset_policies": ["NEVER", "YEARLY", "MONTHLY", "DAILY"],
            "field_name": "invoice_number",
        },
        "delivery_note": {
            "label": _("Delivery Note"),
            "default_pattern": "DN-{YYYY}-{SEQ:5}",
            "allowed_reset_policies": ["NEVER", "YEARLY", "MONTHLY", "DAILY"],
            "field_name": "delivery_number",
        },
        "item": {
            "label": _("Item"),
            "default_pattern": "ITEM-{SEQ:5}",
            "allowed_reset_policies": ["NEVER", "YEARLY", "MONTHLY", "DAILY"],
            "field_name": "sku",
        },
        "serial_number": {
            "label": _("Serial Number"),
            "default_pattern": "SN-{SEQ:5}",
            "allowed_reset_policies": ["NEVER", "YEARLY", "MONTHLY", "DAILY"],
            "field_name": "serial_number",
        },
        "stock_transfer": {
            "label": _("Stock Transfer"),
            "default_pattern": "TRF-{SEQ:5}",
            "allowed_reset_policies": ["NEVER", "YEARLY", "MONTHLY", "DAILY"],
            "field_name": "transfer_number",
        },
        "vendor": {
            "label": _("Vendor"),
            "default_pattern": "VEN-{SEQ:5}",
            "allowed_reset_policies": ["NEVER", "YEARLY", "MONTHLY", "DAILY"],
            "field_name": "code",
        },
        "customer": {
            "label": _("Customer"),
            "default_pattern": "CUST-{YYYY}-{SEQ:5}",
            "allowed_reset_policies": ["NEVER", "YEARLY", "MONTHLY", "DAILY"],
            "field_name": "customer_code",
        },
        "pos_transaction": {
            "label": _("POS Transaction"),
            "default_pattern": "POS-{YYYY}-{SEQ:5}",
            "allowed_reset_policies": ["NEVER", "YEARLY", "MONTHLY", "DAILY"],
            "field_name": "transaction_number",
        },
        "journal_entry": {
            "label": _("Journal Entry"),
            "default_pattern": "JV-{YYYY}-{SEQ:5}",
            "allowed_reset_policies": ["NEVER", "YEARLY", "MONTHLY", "DAILY"],
            "field_name": "entry_number",
        },
        "payment_entry": {
            "label": _("Payment Entry"),
            "default_pattern": "PE-{YYYY}-{SEQ:5}",
            "allowed_reset_policies": ["NEVER", "YEARLY", "MONTHLY", "DAILY"],
            "field_name": "payment_number",
        },
    }

    @classmethod
    def get(cls, document_type: str) -> dict:
        return cls._registry.get(document_type, {})

    @classmethod
    def get_field_name(cls, document_type: str) -> str | None:
        return cls._registry.get(document_type, {}).get("field_name")

    @classmethod
    def register(
        cls,
        document_type: str,
        label: str,
        default_pattern: str,
        allowed_reset_policies: list[str] | None = None,
    ):
        cls._registry[document_type] = {
            "label": label,
            "default_pattern": default_pattern,
            "allowed_reset_policies": allowed_reset_policies
            or [
                ResetPolicy.NEVER,
                ResetPolicy.DAILY,
                ResetPolicy.MONTHLY,
                ResetPolicy.YEARLY,
            ],
        }

    @classmethod
    def get_all(cls) -> dict[str, dict]:
        return cls._registry

    @classmethod
    def enabled_document_types(cls) -> set[str]:
        return set(cls._registry.keys())

    @classmethod
    def get_types(cls) -> list[dict]:
        from core.admin.models.number_series import NumberSeries
        types: list[dict] = []
        definitions = NumberSeries.VARIABLE_DEFINITIONS
        for key, meta in cls._registry.items():
            variables = [
                {"variable": var, "description": str(desc)}
                for var, desc in definitions.items()
            ]
            types.append(
                {
                    "value": key,
                    "label": str(meta["label"]),
                    "allowed_reset_policies": meta["allowed_reset_policies"],
                    "variables": variables,
                }
            )
        return types


class NumberSeriesNotConfiguredError(Exception):
    """Raised when no matching series configuration exists for the given scope."""


@dataclass(frozen=True)
class OrgNumberSeriesScope:
    company: object
    business_unit: object | None
    branch: object | None


class NumberSeriesService:
    """
    Service responsible for generating and managing codes from NumberSeries definitions.
    Allows administrators to dynamically customize patterns, prefixes, suffixes, and reset policies in DB.
    """

    @classmethod
    def default_prefix_for(cls, document_type: str) -> str:
        meta = NumberSeriesRegistry.get(document_type)
        pattern = meta.get("default_pattern", "")
        if "-" in pattern:
            return pattern.split("-")[0]
        return document_type.upper()[:4]

    @classmethod
    def _should_reset(cls, reset_policy: str, last_reset_at: datetime | None, now: datetime) -> bool:
        from core.admin.models.number_series import ResetPolicy
        if not last_reset_at or reset_policy == ResetPolicy.NEVER:
            return False

        last_loc = timezone.localtime(last_reset_at)
        now_loc = timezone.localtime(now)

        if reset_policy == ResetPolicy.YEARLY:
            return last_loc.year != now_loc.year
        elif reset_policy == ResetPolicy.MONTHLY:
            return (last_loc.year, last_loc.month) != (now_loc.year, now_loc.month)
        elif reset_policy == ResetPolicy.DAILY:
            return (last_loc.year, last_loc.month, last_loc.day) != (now_loc.year, now_loc.month, now_loc.day)
        return False

    @classmethod
    def _format_pattern(
        cls,
        pattern: str,
        seq: int,
        now: datetime,
        company=None,
        business_unit=None,
        branch=None,
        number_length: int = 5,
        is_preview: bool = False,
    ) -> str:
        from core.admin.models.number_series import NumberSeries
        now_loc = timezone.localtime(now)
        year_str = f"{now_loc.year:04d}"
        yy_str = year_str[-2:]
        month_str = f"{now_loc.month:02d}"
        day_str = f"{now_loc.day:02d}"

        company_code = str(getattr(company, "code", "")) if company else ""
        if not company_code and is_preview:
            company_code = "COMPANY"

        bu_code = str(getattr(business_unit, "code", "")) if business_unit else ""
        if not bu_code and is_preview:
            bu_code = "BU"

        branch_code = str(getattr(branch, "code", "")) if branch else ""
        if not branch_code and is_preview:
            branch_code = "BRANCH"

        result = pattern
        result = result.replace("{YYYY}", year_str)
        result = result.replace("{YY}", yy_str)
        result = result.replace("{MM}", month_str)
        result = result.replace("{DD}", day_str)
        result = result.replace("{COMPANY_CODE}", company_code)
        result = result.replace("{BU_CODE}", bu_code)
        result = result.replace("{BRANCH_CODE}", branch_code)

        def replace_seq(match: re.Match) -> str:
            token = match.group(1)
            if token == "SEQ":
                return f"{seq:0{number_length}d}"
            if token.startswith("SEQ:"):
                length_str = token.split(":", 1)[1]
                if length_str.isdigit():
                    return f"{seq:0{int(length_str)}d}"
            return match.group(0)

        result = NumberSeries.TOKEN_PATTERN.sub(replace_seq, result)
        return result

    @classmethod
    def ensure_company_series(cls, company) -> int:
        """
        Ensure company-scoped NumberSeries records exist for every registry type.
        Allows administrative users to view and edit configurations in DB.
        """
        from core.admin.models.number_series import NumberSeries, ResetPolicy
        company_id = getattr(company, "pk", company)
        created_count = 0

        for dtype, meta in NumberSeriesRegistry.get_all().items():
            series, created = NumberSeries.objects.get_or_create(
                document_type=dtype,
                company_id=company_id,
                business_unit_id=None,
                branch_id=None,
                defaults={
                    "pattern": meta.get("default_pattern", f"{dtype.upper()[:3]}-{{YYYY}}-{{SEQ:5}}"),
                    "current_number": 0,
                    "number_length": 5,
                    "reset_policy": ResetPolicy.NEVER,
                    "prefix": "",
                    "suffix": "",
                    "is_active": True,
                },
            )
            if created:
                created_count += 1

        return created_count

    @classmethod
    def get_company_config_bundle(cls, company) -> dict[str, dict]:
        """
        Returns all user-editable NumberSeries configurations for a company,
        including a preview of the next generated code.
        """
        cls.ensure_company_series(company)
        company_id = getattr(company, "pk", company)

        records = NumberSeries.objects.filter(
            company_id=company_id,
            business_unit_id=None,
            branch_id=None,
        )

        bundle = {}
        now = timezone.now()

        for rec in records:
            preview_seq = rec.current_number + 1
            if cls._should_reset(rec.reset_policy, rec.last_reset_at, now):
                preview_seq = 1

            code = cls._format_pattern(
                pattern=rec.pattern,
                seq=preview_seq,
                now=now,
                company=company,
                number_length=rec.number_length,
                is_preview=True,
            )
            if rec.prefix:
                code = f"{rec.prefix}{code}"
            if rec.suffix:
                code = f"{code}{rec.suffix}"

            bundle[rec.document_type] = {
                "id": str(rec.id),
                "document_type": rec.document_type,
                "pattern": rec.pattern,
                "prefix": rec.prefix,
                "suffix": rec.suffix,
                "reset_policy": rec.reset_policy,
                "number_length": rec.number_length,
                "current_number": rec.current_number,
                "is_active": rec.is_active,
                "preview_code": code,
            }

        return bundle

    @classmethod
    @transaction.atomic
    def bulk_set_company_overrides(cls, company, entries: dict[str, dict]):
        """
        Allows administrative users to bulk update NumberSeries configurations in the database.
        Changes immediately take effect for future sequence code generations.
        """
        company_id = getattr(company, "pk", company)
        cls.ensure_company_series(company)

        for dtype, entry in entries.items():
            if dtype not in NumberSeriesRegistry.enabled_document_types():
                continue

            rec = NumberSeries.objects.filter(
                document_type=dtype,
                company_id=company_id,
                business_unit_id=None,
                branch_id=None,
            ).first()

            if not rec:
                continue

            if "pattern" in entry:
                rec.pattern = str(entry["pattern"]).strip()
            if "prefix" in entry:
                rec.prefix = str(entry["prefix"]).strip()
            if "suffix" in entry:
                rec.suffix = str(entry["suffix"]).strip()
            if "reset_policy" in entry:
                rec.reset_policy = entry["reset_policy"]
            if "number_length" in entry:
                rec.number_length = int(entry["number_length"])
            if "is_active" in entry:
                rec.is_active = bool(entry["is_active"])

            rec.save(update_fields=[
                "pattern", "prefix", "suffix", "reset_policy",
                "number_length", "is_active", "updated_at",
            ])

    @classmethod
    def preview(
        cls,
        document_type: str,
        company=None,
        business_unit=None,
        branch=None,
        pattern: str | None = None,
        prefix: str | None = None,
        suffix: str | None = None,
        number_length: int | None = None,
    ) -> str:
        """
        Generates a preview code without incrementing sequence counters in DB.
        """
        now = timezone.now()
        company_id = getattr(company, "pk", company)
        bu_id = getattr(business_unit, "pk", business_unit)
        branch_id = getattr(branch, "pk", branch)

        rec = (
            NumberSeries.objects.filter(
                document_type=document_type,
                company_id=company_id,
                business_unit_id=bu_id,
                branch_id=branch_id,
                is_active=True,
            ).first()
            or NumberSeries.objects.filter(
                document_type=document_type,
                company_id=company_id,
                business_unit_id=None,
                branch_id=None,
                is_active=True,
            ).first()
        )

        p = pattern if pattern is not None else (rec.pattern if rec else "PO-{YYYY}-{SEQ:5}")
        pre = prefix if prefix is not None else (rec.prefix if rec else "")
        suf = suffix if suffix is not None else (rec.suffix if rec else "")
        n_len = number_length if number_length is not None else (rec.number_length if rec else 5)
        seq = (rec.current_number if rec else 0) + 1

        code = cls._format_pattern(
            pattern=p,
            seq=seq,
            now=now,
            company=company,
            business_unit=business_unit,
            branch=branch,
            number_length=n_len,
            is_preview=True,
        )
        return f"{pre}{code}{suf}"

    @classmethod
    def next(
        cls,
        document_type: str,
        company=None,
        business_unit=None,
        branch=None,
    ) -> str:
        """
        Allocate the next sequence number for a document type and org scope atomically.
        Respects DB configurations edited by users.
        """
        now = timezone.now()

        with transaction.atomic():
            company_id = getattr(company, "pk", company)
            bu_id = getattr(business_unit, "pk", business_unit)
            branch_id = getattr(branch, "pk", branch)

            scope_candidates = [
                (company_id, bu_id, branch_id),
                (company_id, bu_id, None),
                (company_id, None, None),
                (None, None, None),
            ]

            series = None
            for c_id, b_id, br_id in scope_candidates:
                series = (
                    NumberSeries.objects.select_for_update()
                    .filter(
                        document_type=document_type,
                        company_id=c_id,
                        business_unit_id=b_id,
                        branch_id=br_id,
                        is_active=True,
                    )
                    .first()
                )
                if series:
                    break

            if not series:
                meta = NumberSeriesRegistry.get(document_type)
                default_pattern = meta.get("default_pattern", f"{document_type.upper()[:3]}-{{YYYY}}-{{SEQ:5}}")
                series = NumberSeries.objects.create(
                    document_type=document_type,
                    company_id=company_id,
                    business_unit_id=bu_id,
                    branch_id=branch_id,
                    pattern=default_pattern,
                    current_number=0,
                    number_length=5,
                    reset_policy=ResetPolicy.NEVER,
                )
                series = NumberSeries.objects.select_for_update().get(pk=series.pk)

            if cls._should_reset(series.reset_policy, series.last_reset_at, now):
                series.current_number = 1
                series.last_reset_at = now
            else:
                series.current_number += 1

            series.save(update_fields=["current_number", "last_reset_at", "updated_at"])

            code = cls._format_pattern(
                pattern=series.pattern,
                seq=series.current_number,
                now=now,
                company=company,
                business_unit=business_unit,
                branch=branch,
                number_length=series.number_length,
            )

            if series.prefix:
                code = f"{series.prefix}{code}"
            if series.suffix:
                code = f"{code}{series.suffix}"

            return code
