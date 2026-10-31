import json
import logging
from datetime import date, datetime, time
from decimal import Decimal, InvalidOperation

from django.db.models import F, Q
from django.utils.dateparse import parse_date, parse_datetime

logger = logging.getLogger(__name__)

# -------------------------------------------------------
# FilterSchema: Declarative filter metadata for ViewSets
# -------------------------------------------------------

LOOKUP_OPERATORS = frozenset(
    [
        "exact",
        "iexact",
        "contains",
        "icontains",
        "startswith",
        "istartswith",
        "endswith",
        "iendswith",
        "gt",
        "gte",
        "lt",
        "lte",
        "in",
        "range",
        "isnull",
        "date",
        "year",
        "month",
        "day",
    ]
)

TYPE_DEFAULT_LOOKUPS = {
    int: frozenset(["exact", "gt", "gte", "lt", "lte", "range", "in", "isnull"]),
    float: frozenset(["exact", "gt", "gte", "lt", "lte", "range", "in", "isnull"]),
    Decimal: frozenset(["exact", "gt", "gte", "lt", "lte", "range", "in", "isnull"]),
    datetime: frozenset(
        ["exact", "gt", "gte", "lt", "lte", "range", "date", "year", "month", "day", "isnull"]
    ),
    date: frozenset(["exact", "gt", "gte", "lt", "lte", "range", "year", "month", "day", "isnull"]),
    time: frozenset(["exact", "gt", "gte", "lt", "lte", "range", "isnull"]),
    str: frozenset(
        [
            "exact",
            "iexact",
            "contains",
            "icontains",
            "startswith",
            "istartswith",
            "endswith",
            "iendswith",
            "in",
            "isnull",
        ]
    ),
    bool: frozenset(["exact", "isnull"]),
}


class FilterField:
    """
    Metadata for a single filterable field.
    Declares type coercion, allowed lookup operators, and relation traversal.
    Automatically assigns appropriate operators based on field type if not specified.
    """

    def __init__(self, type=str, lookups=None, default_lookup="exact", related=None, is_json=False):
        self.type = type
        self.is_json = (
            is_json or type is dict or (isinstance(type, str) and type.lower() in ("json", "jsonb"))
        )
        if lookups is not None:
            self.lookups = frozenset(lookups)
        else:
            self.lookups = TYPE_DEFAULT_LOOKUPS.get(type, frozenset(["exact", "isnull"]))
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
                return value.lower() in ("true", "1", "yes", "t")
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
                parsed = parse_datetime(value)
                if parsed is None:
                    # Fallback: parse as date and convert to start-of-day datetime if needed
                    parsed_d = parse_date(value)
                    if parsed_d:
                        return datetime.combine(parsed_d, time.min)
                return parsed
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

    def coerce_lookup(self, lookup: str, raw_value):
        """
        Coerce value specifically for the designated lookup operator.
        Handles collection/range splitting, isnull booleans, and date shortcuts.
        """
        if lookup == "isnull":
            if isinstance(raw_value, str):
                return raw_value.lower() in ("true", "1", "yes", "t")
            return bool(raw_value)

        if lookup == "in":
            if raw_value is None or raw_value == "":
                return []
            if isinstance(raw_value, str):
                items = [v.strip() for v in raw_value.split(",") if v.strip()]
            elif isinstance(raw_value, (list, tuple, set)):
                items = list(raw_value)
            else:
                items = [raw_value]
            return [self.coerce(item) for item in items]

        if lookup == "range":
            if isinstance(raw_value, str):
                parts = [v.strip() for v in raw_value.split(",")]
            elif isinstance(raw_value, (list, tuple)):
                parts = list(raw_value)
            else:
                raise ValueError(
                    f"Range lookup expects two comma-separated values, got: {raw_value}"
                )
            if len(parts) != 2:
                raise ValueError(
                    f"Range lookup expects exactly 2 comma-separated values [min,max], got {len(parts)}: {raw_value}"
                )
            start_val = self.coerce(parts[0])
            end_val = self.coerce(parts[1])
            if start_val is None or end_val is None:
                raise ValueError(f"Failed to coerce range values: {parts}")
            return (start_val, end_val)

        if lookup == "date":
            if isinstance(raw_value, str):
                parsed = parse_date(raw_value)
                if parsed is None:
                    raise ValueError(f"Invalid date format for date lookup: {raw_value}")
                return parsed
            return raw_value

        if lookup in ("year", "month", "day"):
            return int(raw_value)

        return self.coerce(raw_value)


class FilterSchema:
    """
    Schema declaring filterable fields with type metadata.
    Used by filter_queryset for type coercion and lookup validation.

    Usage on ViewSet:
        filter_schema = FilterSchema(
            name=FilterField(type=str, lookups=["exact", "icontains"]),
            is_active=FilterField(type=bool),
            price=FilterField(type=Decimal),  # automatically includes gt, gte, lt, lte, range, in
            created_at=FilterField(type=datetime),  # automatically includes range, gte, lte, date
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
        Handles lookup suffixes: 'price__gte' -> field='price', lookup='gte'
        Supports JSONField deep key paths (e.g., 'metadata__specs__ram', 'attributes__color__icontains')
        Returns (FilterField, resolved_lookup, model_field) or (None, None, None) if not found.
        """
        # 1. Try exact match first (e.g., param "name" -> field "name")
        if param_name in self.fields:
            field = self.fields[param_name]
            return field, field.default_lookup, param_name

        # 2. Try splitting single lookup suffix (e.g., "name__icontains" -> base="name", lookup="icontains")
        parts = param_name.rsplit("__", 1)
        if len(parts) == 2:
            base, lookup = parts
            if base in self.fields and lookup in LOOKUP_OPERATORS:
                field = self.fields[base]
                if lookup in field.lookups:
                    return field, lookup, base

        # 3. Handle multi-level JSON key paths or related paths (e.g., "company__name__icontains")
        if "__" in param_name:
            segments = param_name.split("__")
            root_field = segments[0]
            last_segment = segments[-1]

            if last_segment in LOOKUP_OPERATORS:
                candidate_field = "__".join(segments[:-1])
                lookup = last_segment
            else:
                candidate_field = param_name
                lookup = "exact"

            if candidate_field in self.fields:
                field = self.fields[candidate_field]
                if lookup in field.lookups:
                    return field, lookup, candidate_field

            # Deep JSON field fallback where root is registered and declared as json
            if root_field in self.fields:
                field_meta = self.fields[root_field]
                if getattr(field_meta, "is_json", False) or root_field in (
                    "metadata",
                    "attributes",
                    "extensions",
                ):
                    resolved_field = (
                        "__".join(segments[:-1]) if last_segment in LOOKUP_OPERATORS else param_name
                    )
                    return (
                        field_meta,
                        last_segment if last_segment in LOOKUP_OPERATORS else "exact",
                        resolved_field,
                    )

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

        for raw_key, raw_value in field_search.items():
            if raw_value is None or raw_value == "":
                continue

            if filter_schema:
                # Schema-driven: parse lookup, validate, coerce
                field_meta, lookup, resolved_field = filter_schema.get_field(raw_key)

                if field_meta is None:
                    if _log:
                        _log.warning(
                            f"Filter field '{raw_key}' not permitted in filter_schema. Skipping."
                        )
                    continue

                try:
                    coerced_value = field_meta.coerce_lookup(lookup, raw_value)
                except (ValueError, TypeError, InvalidOperation) as e:
                    if _log:
                        _log.warning(
                            f"Coercion failed for filter '{raw_key}' with value '{raw_value}': {e}"
                        )
                    continue

                model_field = resolved_field if lookup == "exact" else f"{resolved_field}__{lookup}"

                try:
                    filters &= Q(**{model_field: coerced_value})
                except Exception as e:
                    if _log:
                        _log.warning(
                            f"Filter application failed for {model_field}={coerced_value}: {e}"
                        )
            else:
                if _log:
                    _log.warning(
                        f"No filter_schema configured on viewset. Skipping filter param '{raw_key}'."
                    )

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
        from django.core.exceptions import FieldError
        from rest_framework.exceptions import ValidationError

        class QueryEngine:
            def __init__(self, filter_fields=None, filter_schema=None):
                self.filter_fields = filter_fields
                self.filter_schema = filter_schema

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
                if self.filter_schema:
                    field_meta, lookup, resolved = self.filter_schema.get_field(key)
                    if field_meta is not None:
                        model_field = resolved if lookup == "exact" else f"{resolved}__{lookup}"
                        try:
                            coerced = field_meta.coerce_lookup(lookup, value)
                        except (ValueError, TypeError, InvalidOperation):
                            coerced = value
                        return Q(**{model_field: coerced})
                    raise ValidationError({key: f"Filtering on '{key}' is not permitted."})
                raise ValidationError({"query": "Filtering requires a declared filter_schema."})

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
