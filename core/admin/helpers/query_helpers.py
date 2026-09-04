from django.db.models import Q, F
from django.utils.dateparse import parse_datetime, parse_date
from datetime import datetime, date, time
from decimal import Decimal, InvalidOperation
import json
import logging

logger = logging.getLogger(__name__)

# -------------------------------------------------------
# FilterSchema: Declarative filter metadata for ViewSets
# -------------------------------------------------------

LOOKUP_OPERATORS = frozenset([
    "exact", "iexact",
    "contains", "icontains",
    "startswith", "istartswith",
    "endswith", "iendswith",
    "gt", "gte", "lt", "lte",
    "in", "range",
    "isnull",
])


class FilterField:
    """
    Metadata for a single filterable field.
    Declares type coercion, allowed lookup operators, and relation traversal.
    """

    def __init__(self, type=str, lookups=None, default_lookup="exact", related=None):
        self.type = type
        self.lookups = frozenset(lookups or ["exact"])
        self.default_lookup = default_lookup
        self.related = related  # e.g., "company" for company__name traversal

    def coerce(self, value):
        """Coerce raw query string value to the declared Python type.
        Skips values that are already the correct type (e.g., from JSON parsing)."""
        if value is None or value == "":
            return value

        # Check bool before int (since bool is a subclass of int)
        if self.type is bool:
            if isinstance(value, str):
                return value.lower() in ("true", "1", "yes")
            return bool(value)
        if self.type is int:
            # Handle bool→int conversion explicitly
            if isinstance(value, bool):
                return int(value)
            return int(value)
        if self.type is float:
            return float(value)
        if self.type is Decimal:
            return Decimal(str(value))
        if self.type is datetime:
            if isinstance(value, str):
                return parse_datetime(value)
            return value
        if self.type is date:
            if isinstance(value, str):
                return parse_date(value)
            return value
        if self.type is time:
            if isinstance(value, str):
                from django.utils.dateparse import parse_time
                return parse_time(value)
            return value

        # Skip coercion if already the correct type (JSON-parsed values)
        if isinstance(value, self.type):
            return value

        return value  # str or anything else passes through


class FilterSchema:
    """
    Schema declaring filterable fields with type metadata.
    Used by filter_queryset for type coercion and lookup validation.

    Usage on ViewSet:
        filter_schema = FilterSchema(
            name=FilterField(type=str, lookups=["exact", "icontains"]),
            is_active=FilterField(type=bool),
            created_at=FilterField(type=datetime, lookups=["exact", "gte", "lte"]),
            company__name=FilterField(type=str, lookups=["exact", "icontains"], related="company"),
        )
    """

    def __init__(self, **field_defs):
        self.fields = {}
        for name, field_def in field_defs.items():
            if isinstance(field_def, FilterField):
                self.fields[name] = field_def
            elif isinstance(field_def, type):
                self.fields[name] = FilterField(type=field_def)
            else:
                self.fields[name] = FilterField()

    def get_field(self, param_name):
        """
        Resolve a query param name to its FilterField.
        Handles lookup suffixes: 'name__icontains' -> field='name', lookup='icontains'
        Supports JSONField deep key paths (e.g., 'metadata__specs__ram', 'attributes__color__icontains')
        Returns (FilterField, resolved_lookup, model_field) or (None, None, None) if not found.
        """
        # 1. Try exact match first (e.g., param "name" -> field "name")
        if param_name in self.fields:
            return self.fields[param_name], "exact", param_name

        # 2. Try splitting single lookup suffix (e.g., "name__icontains" -> base="name", lookup="icontains")
        parts = param_name.rsplit("__", 1)
        if len(parts) == 2:
            base, lookup = parts
            if base in self.fields:
                field = self.fields[base]
                if lookup in field.lookups:
                    return field, lookup, base

        # 3. Handle multi-level JSON key paths (e.g., "attributes__color__icontains", "metadata__specs__ram")
        if "__" in param_name:
            segments = param_name.split("__")
            root_field = segments[0]
            if root_field in self.fields:
                field_meta = self.fields[root_field]
                last_segment = segments[-1]
                if last_segment in LOOKUP_OPERATORS:
                    lookup = last_segment
                    resolved_field = "__".join(segments[:-1])
                else:
                    lookup = "exact"
                    resolved_field = param_name
                return field_meta, lookup, resolved_field

        return None, None, None


# -------------------------------------------------------
# JSON Query Engine (module-level, registered once)
# -------------------------------------------------------

class OperatorRegistry:
    _registry = {}

    @classmethod
    def register(cls, keys, handler):
        if isinstance(keys, str):
            keys = [keys]
        for key in keys:
            cls._registry[str(key).upper()] = handler

    @classmethod
    def get_handler(cls, key):
        return cls._registry.get(str(key).upper())


def _handle_or(engine, value):
    from rest_framework.exceptions import ValidationError
    if not isinstance(value, list):
        raise ValidationError({"query": "OR value must be a list"})
    or_q = Q()
    for item in value:
        or_q |= engine.parse(item)
    return or_q


def _handle_and(engine, value):
    from rest_framework.exceptions import ValidationError
    if not isinstance(value, list):
        raise ValidationError({"query": "AND value must be a list"})
    and_q = Q()
    for item in value:
        and_q &= engine.parse(item)
    return and_q


def _handle_f(engine, value):
    from rest_framework.exceptions import ValidationError
    if not isinstance(value, dict):
        raise ValidationError({"query": "F value must be an object"})
    q_obj = Q()
    for f_key, f_val in value.items():
        if isinstance(f_val, str):
            q_obj &= Q(**{f_key: F(f_val)})
    return q_obj


OperatorRegistry.register(["OR", "||"], _handle_or)
OperatorRegistry.register(["AND", "&&"], _handle_and)
OperatorRegistry.register(["F"], _handle_f)


# -------------------------------------------------------
# Enhanced filter_queryset
# -------------------------------------------------------

def filter_queryset(
    queryset,
    search_fields=None,
    search_query=None,
    filter_fields=None,
    filter_schema=None,
    field_search=None,
    sort_query=None,
    query=None,
    log=None,
    logger=None,
):
    """
    Advanced filtering for querysets with schema-driven type coercion.

    Supports:
    - Multi-field search (OR logic via Q)
    - Schema-validated field filtering with type coercion and lookup operators
    - Related field traversal (company__name, roles__name)
    - Dynamic sorting (?sort=-created_at)
    - Advanced JSON queries (Nested AND/OR, F() comparisons)

    Parameters:
        filter_schema: FilterSchema instance for type coercion and validation.
                       When provided, supersedes filter_fields for type handling.
        filter_fields: Legacy list[tuple[str,str]] for field mapping (backward compat).
    """
    _log = log or logger

    # 1. Multi-field Search
    if search_query and search_fields:
        search_term = search_query.strip()
        if search_term:
            search_filter = Q()
            for field in search_fields:
                try:
                    lookup = field if "__" in field else f"{field}__icontains"
                    search_filter = search_filter | Q(**{lookup: search_term})
                except Exception as e:
                    if _log:
                        _log.warning(f"Search failed for {field}: {e}")

            if search_filter:
                queryset = queryset.filter(search_filter)

    # 2. Dynamic Field Filtering with Schema
    if field_search:
        filters = Q()
        allowed_legacy = dict(filter_fields) if filter_fields else {}

        for raw_key, raw_value in field_search.items():
            if not raw_value and raw_value != False:
                continue

            model_field = raw_key
            coerced_value = raw_value

            if filter_schema:
                # Schema-driven: parse lookup, validate, coerce
                field_meta, lookup, resolved_field = filter_schema.get_field(raw_key)

                if field_meta is None:
                    # Check if it's a legacy mapping
                    if raw_key in allowed_legacy:
                        model_field = allowed_legacy[raw_key]
                    else:
                        if _log:
                            _log.warning(f"Filter field '{raw_key}' not in schema or legacy mappings. Skipping.")
                        continue
                else:
                    # Schema matched — build lookup
                    model_field = resolved_field if lookup == "exact" else f"{resolved_field}__{lookup}"
                    # Handle __in lookups — split before coercion
                    if lookup == "in" and isinstance(raw_value, str) and "," in raw_value:
                        items = [v.strip() for v in raw_value.split(",")]
                        coerced_value = []
                        for item in items:
                            try:
                                coerced_value.append(field_meta.coerce(item))
                            except (ValueError, TypeError, InvalidOperation) as e:
                                if _log:
                                    _log.warning(f"Coercion failed for {raw_key} item '{item}': {e}")
                                continue
                    else:
                        try:
                            coerced_value = field_meta.coerce(raw_value)
                        except (ValueError, TypeError, InvalidOperation) as e:
                            if _log:
                                _log.warning(f"Coercion failed for {raw_key}={raw_value}: {e}")
                            continue

            elif allowed_legacy:
                # Legacy fallback: map param to model field
                model_field = allowed_legacy.get(raw_key, raw_key)

            # Handle __in lookups with comma-separated values
            if isinstance(coerced_value, str) and "," in coerced_value and "__in" in model_field:
                coerced_value = [v.strip() for v in coerced_value.split(",")]

            try:
                filters = filters & Q(**{model_field: coerced_value})
            except Exception as e:
                if _log:
                    _log.warning(f"Filter failed for {model_field}={coerced_value}: {e}")

        if filters:
            queryset = queryset.filter(filters)

    # 3. Dynamic Sorting
    if sort_query:
        try:
            sort_fields = [f.strip() for f in sort_query.split(",")]
            queryset = queryset.order_by(*sort_fields)
        except Exception as e:
            if _log:
                _log.warning(f"Sorting failed for {sort_query}: {e}")

    # 4. JSON-based Dynamic Q/F filtering
    if query:
        from rest_framework.exceptions import ValidationError
        from django.core.exceptions import FieldError

        class QueryEngine:
            def __init__(self, filter_fields=None, filter_schema=None):
                self.filter_fields = filter_fields
                self.filter_schema = filter_schema
                self.allowed_legacy = dict(filter_fields) if filter_fields else {}

            def parse(self, node):
                if not isinstance(node, dict):
                    return Q()

                q_obj = Q()
                for key, value in node.items():
                    handler = OperatorRegistry.get_handler(key)
                    if handler:
                        q_obj &= handler(self, value)
                    else:
                        q_obj &= self.handle_standard(key, value)
                return q_obj

            def handle_standard(self, key, value):
                base_key = key.split("__")[0]

                # Check schema first
                if self.filter_schema:
                    field_meta, lookup, resolved = self.filter_schema.get_field(key)
                    if field_meta is not None:
                        model_field = resolved if lookup == "exact" else f"{resolved}__{lookup}"
                        try:
                            coerced = field_meta.coerce(value)
                        except (ValueError, TypeError):
                            coerced = value
                        return Q(**{model_field: coerced})
                    # Not in schema — check if it's a legacy mapping
                    if base_key in self.allowed_legacy:
                        model_field = self.allowed_legacy.get(key) or self.allowed_legacy.get(base_key)
                        if model_field and base_key != model_field:
                            key = model_field + key[len(base_key):]
                        return Q(**{key: value})
                    raise ValidationError({key: f"Filtering on '{base_key}' is not permitted."})

                # Legacy fallback
                if self.allowed_legacy:
                    if base_key not in self.allowed_legacy and key not in self.allowed_legacy:
                        raise ValidationError({key: f"Filtering on '{base_key}' is not permitted."})
                    model_field = self.allowed_legacy.get(key) or self.allowed_legacy.get(base_key)
                    if model_field and base_key != model_field:
                        key = model_field + key[len(base_key):]

                return Q(**{key: value})

        try:
            parsed_json = json.loads(query) if isinstance(query, str) else query
            engine = QueryEngine(filter_fields=filter_fields, filter_schema=filter_schema)
            q_tree = engine.parse(parsed_json)

            if q_tree:
                queryset = queryset.filter(q_tree)

        except ValidationError:
            raise
        except FieldError as e:
            raise ValidationError({"query": f"Invalid field or lookup: {str(e)}"})
        except json.JSONDecodeError as e:
            raise ValidationError({"query": f"Invalid JSON payload: {str(e)}"})
        except ValueError as e:
            raise ValidationError({"query": f"Invalid data type for field: {str(e)}"})
        except Exception as e:
            if _log:
                _log.warning(f"JSON filtering failed: {e}")
            raise ValidationError({"query": "Malformed JSON query payload."})

    return queryset
