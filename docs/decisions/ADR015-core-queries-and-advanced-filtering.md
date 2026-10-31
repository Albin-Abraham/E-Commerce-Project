# ADR 015: Enterprise Core Queries and Advanced Filtering Engine

## Status
Accepted

## Context
Prior to this architectural revision:
1. **Scattered Inline Queries**: Queries in views and services were written inline against the ORM, often evaluated prematurely via `.first()`, `.get()`, or `list()`. This led to query duplication across API endpoints, Celery workers, and CLI management commands, as well as N+1 query traps from missing pre-fetches.
2. **Deficient Filtering Engine**: URL query parameter filtering relied predominantly on `exact`/`iexact` matches through legacy tuple mappings (`filter_fields = [("field", "field")]`). Key comparative and range lookups (`gt`, `gte`, `lt`, `lte`, `range`, `in`, `isnull`, `date`) were either absent, silently ignored, or broken:
   - `range` lookups crashed with `ValueError` attempting to coerce comma-separated strings as single scalars.
   - Single-item `in` lookups iterated over string characters in SQL.
   - `isnull` lookups attempted to parse `"true"` using the target field's type (e.g. failing on `datetime` or `Decimal`).
   - Legacy `filter_fields` lacked validation, permitting arbitrary parameter passthroughs.

## Decision
1. **3-Tier Core Query Architecture**:
   - **Tier 1 (Custom QuerySets)**: Reusable domain query primitives (`ProductQuerySet`, `OrderQuerySet`) attached via `models.Manager.from_queryset()`. All methods return `self` (the `QuerySet` / `qs` statement).
   - **Tier 2 (Domain Selectors)**: Pure read-functions in `apps/<domain>/selectors/` (e.g. `get_storefront_catalog_qs()`, `get_user_orders_qs()`) that encapsulate complex joins, annotations, and pre-fetches. Selectors **always return an un-evaluated `QuerySet[T]`**, deferring execution to callers and paginators.
   - **Tier 3 (Strategy Scoped Repositories & Base Views)**: `StrategyScopedRepository.get_queryset(context)` establishes tenant/persona isolation without premature evaluation, allowing DRF paginators to execute exact SQL `LIMIT / OFFSET`.

2. **Advanced Filtering Engine Standardization (Zero Legacy Backward-Compatibility)**:
   - Deprecated and removed legacy `filter_fields` tuple configurations in favor of declarative `FilterSchema`.
   - Enhanced `FilterField` with automatic operator inference based on field type (`Decimal`/`float`/`int` -> `exact`, `gt`, `gte`, `lt`, `lte`, `range`, `in`, `isnull`; `datetime`/`date` -> `range`, `date`, `year`, `month`, `day`; `str` -> `icontains`, `in`, `istartswith`).
   - Implemented `FilterField.coerce_lookup(lookup, raw_value)` to robustly handle compound ranges (`(min, max)` tuples), collections (`list[T]` for `in`), boolean coercion for `isnull`, and `parse_date` for `date` lookups.
   - ViewSet dynamic filtering strictly rejects/skips any parameter not declared in `filter_schema`.
   - Updated OpenAPI schema generation in `openai_swagger.py` to document all inferred lookup parameters.

## Consequences
- **Positive**:
  - Full support for numeric comparisons (`?price__gte=50&price__lte=200`), ranges (`?price__range=50,200`), multi/single item sets (`?status__in=ACTIVE`), substring searches (`?name__icontains=laptop`), and temporal shortcuts (`?created_at__date=2026-10-31`).
  - Zero N+1 queries on filtered listings thanks to selector-level `select_related` and `prefetch_related`.
  - Zero data leakage or un-sanitized parameter queries.
  - Complete elimination of legacy dual-code paths.
- **Negative**:
  - ViewSets must explicitly declare `filter_schema = FilterSchema(...)` for query parameters to take effect.
