from django.db.models import Q, F
import json

def filter_queryset(
    queryset,
    search_fields=None,
    search_query=None,
    filter_fields=None,
    field_search=None,
    sort_query=None,
    json_query=None,
    logger=None,
):
    """
    Advanced filtering for querysets.
    Supports:
    - Multi-field search (OR logic via Q)
    - Dynamic lookups (field__iexact, field__gt, field__contains, etc.)
    - Direct field filtering
    - Dynamic sorting (?sort=-created_at)
    - Advanced JSON queries (Nested AND/OR, F() comparisons)
    """

    # 1. Multi-field Search
    if search_query and search_fields:
        search_term = search_query.strip()
        if search_term:
            search_filter = Q()
            for field in search_fields:
                try:
                    # Default to icontains if no lookup provided
                    lookup = field if "__" in field else f"{field}__icontains"
                    search_filter = search_filter | Q(**{lookup: search_term})
                except Exception as e:
                    if logger:
                        logger.warning(f"Search failed for {field}: {e}")

            if search_filter:
                queryset = queryset.filter(search_filter)

    # 2. Dynamic Field Filtering (Lookup support)
    if field_search:
        filters = Q()
        # filter_fields is an optional list of allowed (param, model_field) mappings
        allowed_mappings = dict(filter_fields) if filter_fields else {}

        for key, value in field_search.items():
            if not value:
                continue

            # Map param to model field if mapping exists
            model_field = allowed_mappings.get(key, key)

            try:
                # Support list values for __in lookups
                if isinstance(value, str) and "," in value and "__in" in model_field:
                    value = [v.strip() for v in value.split(",")]

                filters = filters & Q(**{model_field: value})
            except Exception as e:
                if logger:
                    logger.warning(f"Filter failed for {model_field}: {e}")

        if filters:
            queryset = queryset.filter(filters)

    # 3. Dynamic Sorting
    if sort_query:
        try:
            # Support comma-separated sort: ?sort=-created_at,name
            sort_fields = [f.strip() for f in sort_query.split(",")]
            queryset = queryset.order_by(*sort_fields)
        except Exception as e:
            if logger:
                logger.warning(f"Sorting failed for {sort_query}: {e}")

    # 4. JSON-based Dynamic Q/F filtering
    if json_query:
        from rest_framework.exceptions import ValidationError
        from django.core.exceptions import FieldError
        from enum import Enum

        class QueryOperator(str, Enum):
            OR = "OR"
            OR_SYM = "||"
            AND = "AND"
            AND_SYM = "&&"
            F_EXPR = "F"

        class OperatorRegistry:
            """
            SOLID Pattern: Open-Closed Principle
            Provides a central registry for operators. Open for extension, closed for modification.
            """
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
            if not isinstance(value, list):
                return Q()
            or_q = Q()
            for item in value:
                or_q |= engine.parse(item)
            return or_q

        def _handle_and(engine, value):
            if not isinstance(value, list):
                return Q()
            and_q = Q()
            for item in value:
                and_q &= engine.parse(item)
            return and_q

        def _handle_f(engine, value):
            q_obj = Q()
            if isinstance(value, dict):
                for f_key, f_val in value.items():
                    if isinstance(f_val, str):
                        q_obj &= Q(**{f_key: F(f_val)})
            return q_obj

        # Register standard operators using the ENUM
        OperatorRegistry.register([QueryOperator.OR, QueryOperator.OR_SYM], _handle_or)
        OperatorRegistry.register([QueryOperator.AND, QueryOperator.AND_SYM], _handle_and)
        OperatorRegistry.register([QueryOperator.F_EXPR], _handle_f)

        class QueryEngine:
            """
            Industrialized Query Engine:
            Executes logic using the OperatorRegistry strategies (Single Responsibility Principle).
            """
            def __init__(self, filter_fields=None):
                self.filter_fields = filter_fields
                self.allowed_mappings = dict(filter_fields) if filter_fields else {}

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
                if self.filter_fields is not None:
                    base_key = key.split("__")[0]
                    if base_key not in self.allowed_mappings and key not in self.allowed_mappings:
                        raise ValidationError({key: f"Filtering on '{base_key}' is not permitted."})
                    
                    model_field = self.allowed_mappings.get(key) or self.allowed_mappings.get(base_key)
                    if model_field and base_key != model_field:
                        key = key.replace(base_key, model_field, 1)
                
                return Q(**{key: value})

        try:
            parsed_json = json.loads(json_query) if isinstance(json_query, str) else json_query
            engine = QueryEngine(filter_fields=filter_fields)
            q_tree = engine.parse(parsed_json)
            
            if q_tree:
                queryset = queryset.filter(q_tree)
                
        except ValidationError:
            raise
        except FieldError as e:
            raise ValidationError({"json_query": f"Invalid field or lookup: {str(e)}"})
        except ValueError as e:
            raise ValidationError({"json_query": f"Invalid data type for field: {str(e)}"})
        except Exception as e:
            if logger:
                logger.warning(f"JSON filtering failed: {e}")
            raise ValidationError({"json_query": "Malformed JSON query payload."})

    return queryset
