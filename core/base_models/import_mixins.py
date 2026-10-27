from django.utils import timezone
from import_export import resources, fields, widgets
from import_export.results import RowResult


class DynamicHeaderResolver:
    """
    Dynamic Header & Field Namespace Resolver.
    Eliminates hardcoded prefix tuples by parsing incoming column headers dynamically:
    1. Tier:Model:Field format -> e.g., 'definition:category:slug', 'master:product:sku', 'catalog:catalog_item:override_price'
    2. Model:Field format -> e.g., 'item:sku', 'product:sku', 'category:slug', 'catalog_item:is_new_arrival'
    3. Model alias mapping -> maps common model aliases ('item' -> 'product', 'catalog_item' -> 'catalogitem')
    """

    MODEL_ALIAS_MAP = {
        "item": "product",
        "master_item": "product",
        "product_variant": "variant",
        "catalog_item": "catalogitem",
        "tag": "tagdefinition",
        "collection": "catalogcollection",
    }

    @classmethod
    def resolve_header_parts(cls, header: str) -> dict:
        """
        Parses header into clean field name and generated field aliases.
        """
        if not header:
            return {"raw": "", "clean_field": "", "aliases": []}

        raw = str(header).strip()
        parts = [p.strip() for p in raw.split(":") if p.strip()]

        if len(parts) == 3:
            tier, model_alias, field = parts[0].lower(), parts[1].lower(), parts[2]
            model = cls.MODEL_ALIAS_MAP.get(model_alias, model_alias)
            clean_field = f"{model}_{field}" if model_alias not in ("item", "product", "variant", "catalogitem", "catalog_item") else field
            aliases = [model, clean_field, f"{model_alias}_{field}", field, model_alias]
            return {"raw": raw, "clean_field": clean_field, "model": model, "tier": tier, "aliases": aliases}
        elif len(parts) == 2:
            model_alias, field = parts[0].lower(), parts[1]
            model = cls.MODEL_ALIAS_MAP.get(model_alias, model_alias)
            clean_field = f"{model}_{field}" if model_alias not in ("item", "product", "variant", "catalogitem", "catalog_item") else field
            aliases = [model, clean_field, f"{model_alias}_{field}", field, model_alias]
            return {"raw": raw, "clean_field": clean_field, "model": model, "aliases": aliases}
        else:
            raw_lower = raw.lower()
            aliases = [raw]
            if raw_lower.endswith("_code"):
                aliases.append(raw_lower[:-5])
            elif raw_lower.endswith("_sku"):
                aliases.append(raw_lower[:-4])
            elif raw_lower.endswith("_slug"):
                aliases.append(raw_lower[:-5])
            elif raw_lower.endswith("_name"):
                aliases.append(raw_lower[:-5])
            return {"raw": raw, "clean_field": raw, "aliases": aliases}


class HeaderNamespaceNormalizationMixin:
    """
    SOLID Mixin: Single Responsibility = Dynamic Header Namespace Normalization.
    Parses column headers dynamically using DynamicHeaderResolver.
    Populates clean field names and model-specific aliases in dataset headers and row dicts.
    """

    def before_import(self, dataset, **kwargs):
        super_method = getattr(super(), "before_import", None)
        if callable(super_method):
            super_method(dataset, **kwargs)

        if not dataset or not dataset.headers:
            return

        # Build mapping of current resource column names and attribute names
        field_map = {}
        for field in self.get_export_fields():
            if field.column_name:
                field_map[field.column_name.lower()] = field.column_name
            if field.attribute:
                field_map[field.attribute.lower()] = field.column_name

        new_headers = []
        for h in dataset.headers:
            resolved = DynamicHeaderResolver.resolve_header_parts(h)
            matched_col = None
            for alias in resolved["aliases"]:
                if alias and alias.lower() in field_map:
                    matched_col = field_map[alias.lower()]
                    break
            new_headers.append(matched_col or resolved["clean_field"])
        dataset.headers = new_headers

    def before_import_row(self, row, **kwargs):
        super_method = getattr(super(), "before_import_row", None)
        if callable(super_method):
            super_method(row, **kwargs)

        keys_to_add = {}
        for k, v in list(row.items()):
            if not k:
                continue
            resolved = DynamicHeaderResolver.resolve_header_parts(k)
            for alias in resolved["aliases"]:
                if alias and alias not in row:
                    keys_to_add[alias] = v
        row.update(keys_to_add)


class TenantScopedResourceMixin:
    """
    SOLID Mixin: Single Responsibility = Tenant & Company Context Scoping.
    Injects company_id and tenant context into model instances during import.
    """

    company_field_name = "company"

    def before_import_row(self, row, **kwargs):
        super_method = getattr(super(), "before_import_row", None)
        if callable(super_method):
            super_method(row, **kwargs)

        request = kwargs.get("request")
        if request and hasattr(request, "company") and request.company:
            if self.company_field_name not in row or not row.get(self.company_field_name):
                row[self.company_field_name] = str(request.company.id)


class AuditLineageResourceMixin:
    """
    SOLID Mixin: Single Responsibility = Audit Lineage & Provenance.
    Captures external_id, source_import_id, source_file, source_row, imported_at, and imported_by.
    """

    def before_save_instance(self, instance, row=None, **kwargs):
        super_method = getattr(super(), "before_save_instance", None)
        if callable(super_method):
            super_method(instance, row=row, **kwargs)

        row_number = kwargs.get("row_number")
        request = kwargs.get("request")
        source_import_id = kwargs.get("source_import_id")
        source_file = kwargs.get("source_file")

        if hasattr(instance, "metadata") and isinstance(instance.metadata, dict):
            instance.metadata["_import_lineage"] = {
                "source_import_id": source_import_id or "MANUAL_IMPORT",
                "source_file": source_file or "unknown.csv",
                "source_row": row_number,
                "imported_at": timezone.now().isoformat(),
                "imported_by": str(request.user.id) if request and hasattr(request, "user") and request.user else "system",
            }


class ValidationRuleResourceMixin:
    """
    SOLID Mixin: Single Responsibility = Model Validation & Rule Execution.
    Executes full_clean() and platform rules before committing rows to DB.
    """

    def before_save_instance(self, instance, row=None, **kwargs):
        super_method = getattr(super(), "before_save_instance", None)
        if callable(super_method):
            super_method(instance, row=row, **kwargs)

        dry_run = kwargs.get("dry_run", False)
        if hasattr(instance, "full_clean") and not dry_run:
            instance.full_clean()


class BasePlatformModelResource(
    HeaderNamespaceNormalizationMixin,
    TenantScopedResourceMixin,
    AuditLineageResourceMixin,
    ValidationRuleResourceMixin,
    resources.ModelResource,
):
    """
    Base Platform ModelResource combining SOLID mixins.
    Provides standard upsert behavior, dynamic header namespace normalization, tenant scoping, validation, and lineage tracking.
    """

    class Meta:
        skip_unchanged = True
        report_skipped = True
        exclude = ("version", "created_at", "updated_at")
