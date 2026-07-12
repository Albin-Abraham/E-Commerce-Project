from functools import wraps

from django.db import models
from drf_spectacular.extensions import OpenApiViewExtension
from drf_spectacular.utils import (
    OpenApiParameter,
    OpenApiResponse,
    OpenApiTypes,
    extend_schema,
    inline_serializer,
)
from rest_framework import serializers


from drf_spectacular.openapi import AutoSchema

class PlatformOpenAISchema(AutoSchema):
    """
    Platform OpenAI Schema Inspector:
    Strictly filters HTTP methods based on URL hints (HTTP_METHOD) 
    and path context (List vs Detail).
    """
    def get_operation(self, path, path_regex, path_prefix, method, registry):
        # 1. Get the allowed methods from the URL hints
        # Spectacular stores these in self.view.initkwargs
        url_hints = getattr(self.view, 'initkwargs', {}).get('HTTP_METHOD', [])
        
        method_upper = method.upper()
        
        # 2. RULE: Respect URL hints absolutely
        if url_hints and method_upper not in [h.upper() for h in url_hints]:
            return None
            
        # 3. RULE: Contextual Cleanup (List vs Detail)
        # Check if the path has parameters (Detail) or not (List)
        is_detail = '{' in path or '<' in path
        
        if is_detail and method_upper == 'POST':
            return None
        if not is_detail and method_upper in ['PUT', 'PATCH', 'DELETE']:
            return None
            
        return super().get_operation(path, path_regex, path_prefix, method, registry)


def auto_extend_schema(cls):
    """
    Automatic OpenAPI schema generation for BaseAPIView subclasses.
    Analyzes class attributes and methods to generate appropriate documentation.
    """
    entity_name = getattr(cls, "entity_name", None) or cls.__name__.replace(
        "APIView", ""
    )
    display_field = getattr(cls, "entity_display_field", "name")
    tag = [entity_name]
    paginate_enabled = getattr(cls, "paginate", False)
    supports_soft_delete = getattr(cls, "supports_soft_delete", True)
    allow_include_deleted = getattr(cls, "allow_include_deleted", False)
    allow_export = getattr(cls, "allow_export", False)

    import inspect

    def resolve_serializer(instance, is_create_update=False, action=None):
        """Resolve the appropriate serializer class for the instance safely."""
        if hasattr(instance, "get_serializer_class"):
            method = instance.get_serializer_class
            sig = inspect.signature(method)
            params = sig.parameters

            kwargs = {}
            if "is_create_update" in params:
                kwargs["is_create_update"] = is_create_update
            if "action" in params and action is not None:
                kwargs["action"] = action

            return method(**kwargs)

        return getattr(instance, "serializer_class", None)

    def resolve_response_serializer(instance, default_serializer=None):
        """Resolve a dedicated response serializer when a view declares one."""
        return (
            getattr(instance, "response_serializer_class", None) or default_serializer
        )

    def extract_permission_info(method):
        """Extract permission information from the permission_required decorator."""
        permission_info = {}

        if hasattr(method, "_required_permissions"):
            permissions = method._required_permissions

            if permissions:
                permission_info["required_permissions"] = permissions
                permission_info["all_required"] = getattr(
                    method, "_all_required", False
                )

        if hasattr(method, "_bypass_permissions"):
            bypass = method._bypass_permissions
            if bypass:
                permission_info["bypass_permissions"] = list(bypass)

        if hasattr(method, "_is_select_allowed"):
            is_select = method._is_select_allowed
            if is_select:
                permission_info["is_select_allowed"] = is_select

        if hasattr(method, "_bypass_query_params"):
            bypass_params = method._bypass_query_params
            if bypass_params:
                permission_info["bypass_query_params"] = bypass_params

        if hasattr(method, "_permission_error_message"):
            error_msg = method._permission_error_message
            if error_msg:
                permission_info["error_message"] = error_msg

        return permission_info

    def format_permission_description(permission_info):
        """Format permission information into a readable description."""
        if not permission_info:
            return ""

        parts = []

        if "required_permissions" in permission_info:
            perms = permission_info["required_permissions"]
            all_required = permission_info.get("all_required", False)

            if perms and len(perms) > 0 and isinstance(perms[0], (set, frozenset)):
                perm_groups = []
                for perm_group in perms:
                    if perm_group:
                        perm_groups.append(" AND ".join(f"`{p}`" for p in perm_group))
                if perm_groups:
                    perm_str = " OR ".join(f"({group})" for group in perm_groups)
                    parts.append(f"**Required Permissions:** {perm_str}")
            elif perms:
                if all_required:
                    perm_str = " AND ".join(f"`{p}`" for p in perms)
                    parts.append(f"**Required Permissions (ALL):** {perm_str}")
                else:
                    perm_str = " OR ".join(f"`{p}`" for p in perms)
                    parts.append(f"**Required Permissions (ANY):** {perm_str}")

        if "bypass_permissions" in permission_info:
            bypass_perms = permission_info["bypass_permissions"]
            bypass_str = ", ".join(f"`{p}`" for p in bypass_perms)
            parts.append(
                f"**Bypass Permissions:** {bypass_str} (any of these will bypass the required permissions)"
            )

        special_conditions = []

        if permission_info.get("is_select_allowed"):
            special_conditions.append(
                "Select-option requests (Is-Select-Option header) bypass permission checks"
            )

        if "bypass_query_params" in permission_info:
            bypass_params = permission_info["bypass_query_params"]
            for param, values in bypass_params.items():
                values_str = ", ".join(f"`{v}`" for v in values)
                special_conditions.append(
                    f"Query parameter `{param}` with value {values_str} bypasses permission checks"
                )

        if special_conditions:
            parts.append(
                "**Special Conditions:**\n- " + "\n- ".join(special_conditions)
            )

        if "error_message" in permission_info:
            parts.append(
                f"**Permission Denied Message:** {permission_info['error_message']}"
            )

        return "\n\n".join(parts)

    def create_response_wrapper_schema(
        serializer_class, is_list=False, is_paginated=False
    ):
        """Create response wrapper schema matching ResponseFactory patterns."""
        if not serializer_class:
            return inline_serializer(
                name="DefaultResponse",
                fields={
                    "success": serializers.BooleanField(default=True),
                    "message": serializers.CharField(default="Request successful"),
                },
            )

        if is_paginated:
            return inline_serializer(
                name=f"{serializer_class.__name__}PaginatedResponse",
                fields={
                    "success": serializers.BooleanField(default=True),
                    "count": serializers.IntegerField(),
                    "next": serializers.URLField(allow_null=True),
                    "previous": serializers.URLField(allow_null=True),
                    "results": serializer_class(many=True),
                    "has_next": serializers.BooleanField(),
                    "has_previous": serializers.BooleanField(),
                    "total_pages": serializers.IntegerField(),
                },
            )

        if is_list:
            return inline_serializer(
                name=f"{serializer_class.__name__}ListResponse",
                fields={
                    "success": serializers.BooleanField(default=True),
                    "message": serializers.CharField(default="Fetched successfully"),
                    "data": serializer_class(many=True),
                },
            )
        return inline_serializer(
            name=f"{serializer_class.__name__}SingleResponse",
            fields={
                "success": serializers.BooleanField(default=True),
                "message": serializers.CharField(default="Fetched successfully"),
                "data": serializer_class(),
            },
        )

    def get_model_field_type(model, field_name):
        """Convert Django model field to OpenAPI type."""
        try:
            field = model._meta.get_field(field_name)
        except Exception:
            return OpenApiTypes.STR
        if isinstance(field, models.UUIDField):
            return OpenApiTypes.UUID

        if isinstance(field, models.BooleanField):
            return OpenApiTypes.BOOL
        if isinstance(
            field, (models.IntegerField, models.AutoField, models.BigIntegerField)
        ):
            return OpenApiTypes.INT
        if isinstance(field, (models.FloatField, models.DecimalField)):
            return OpenApiTypes.FLOAT
        if isinstance(field, models.DateTimeField):
            return OpenApiTypes.DATETIME
        if isinstance(field, models.DateField):
            return OpenApiTypes.DATE
        if isinstance(
            field, (models.ForeignKey, models.OneToOneField, models.ManyToManyField)
        ):
            return OpenApiTypes.UUID
        return OpenApiTypes.STR

    def build_get_parameters(dummy_instance):
        """Build parameters for GET requests."""
        parameters = []
        model_class = getattr(dummy_instance, "model", None)

        parameters.extend(
            [
                OpenApiParameter(
                    name="Is-Select-Option",
                    type=OpenApiTypes.BOOL,
                    location=OpenApiParameter.HEADER,
                    required=False,
                    description=f"Return only ID and {display_field} using select_serializer_class (skips pagination)",
                ),
                OpenApiParameter(
                    name="select_limit",
                    type=OpenApiTypes.INT,
                    location=OpenApiParameter.QUERY,
                    required=False,
                    description="Limit the number of results for select requests (default: 10)",
                ),
                OpenApiParameter(
                    name="update",
                    type=OpenApiTypes.BOOL,
                    location=OpenApiParameter.QUERY,
                    required=False,
                    description="Return create/update serializer (for update form display)",
                ),
                OpenApiParameter(
                    name="ids",
                    type=OpenApiTypes.STR,
                    location=OpenApiParameter.QUERY,
                    required=False,
                    description="Comma-separated list of IDs to include (Bulk Selection)",
                ),
                OpenApiParameter(
                    name="selected_ids",
                    type=OpenApiTypes.STR,
                    location=OpenApiParameter.QUERY,
                    required=False,
                    description="Alias for 'ids' (Bulk Selection)",
                ),
                OpenApiParameter(
                    name="include_ids",
                    type=OpenApiTypes.STR,
                    location=OpenApiParameter.QUERY,
                    required=False,
                    description="Comma-separated list of IDs to always include in select results (ignored if search is active)",
                ),
            ]
        )

        # Consolidate export logic
        is_export_enabled = (
            allow_export
            or (
                getattr(dummy_instance, "excel_export_headers", None)
                and getattr(dummy_instance, "excel_export_field_mappings", None)
            )
            or getattr(dummy_instance, "excel_export_config", None)
        )

        if is_export_enabled:
            parameters.extend(
                [
                    OpenApiParameter(
                        name="export",
                        type=OpenApiTypes.STR,
                        location=OpenApiParameter.QUERY,
                        required=False,
                        description="Export format (e.g., 'csv', 'excel', 'pdf')",
                        enum=["csv", "excel", "pdf"],
                    ),
                    OpenApiParameter(
                        name="fields",
                        type=OpenApiTypes.STR,
                        location=OpenApiParameter.QUERY,
                        required=False,
                        description="Comma-separated list of fields to include in response or export",
                    ),
                ]
            )
            # Only add advanced export params if specifically configured for Excel/advanced export
            if getattr(dummy_instance, "excel_export_headers", None):
                parameters.extend(
                    [
                        OpenApiParameter(
                            name="export_format",
                            type=OpenApiTypes.STR,
                            location=OpenApiParameter.QUERY,
                            required=False,
                            deprecated=True,
                            description="DEPRECATED: Use 'export' instead.",
                            enum=["csv", "excel", "pdf"],
                        ),
                        OpenApiParameter(
                            name="export_mode",
                            type=OpenApiTypes.STR,
                            location=OpenApiParameter.QUERY,
                            required=False,
                            description="Export mode (sync or async) - Only for advanced exports",
                            enum=["sync", "async"],
                        ),
                    ]
                )
        else:
            parameters.append(
                OpenApiParameter(
                    name="fields",
                    type=OpenApiTypes.STR,
                    location=OpenApiParameter.QUERY,
                    required=False,
                    description="Comma-separated list of fields to include in the response",
                )
            )

        if supports_soft_delete and allow_include_deleted:
            parameters.append(
                OpenApiParameter(
                    name="deleted",
                    type=OpenApiTypes.BOOL,
                    location=OpenApiParameter.QUERY,
                    required=False,
                    description="Include soft-deleted records (only if allow_include_deleted=True)",
                )
            )

        search_fields = getattr(dummy_instance, "search_fields", [])
        if search_fields:
            parameters.append(
                OpenApiParameter(
                    name="search",
                    type=OpenApiTypes.STR,
                    location=OpenApiParameter.QUERY,
                    required=False,
                    description=f"Search across fields: {', '.join(search_fields)}",
                )
            )

        sort_field_mapping = getattr(dummy_instance, "sort_field_mapping", {})
        allowed_sort_fields = getattr(dummy_instance, "allowed_sort_fields", [])
        if sort_field_mapping or allowed_sort_fields:
            sort_fields = allowed_sort_fields or list(sort_field_mapping.keys())
            parameters.append(
                OpenApiParameter(
                    name="sort",
                    type=OpenApiTypes.STR,
                    location=OpenApiParameter.QUERY,
                    required=False,
                    description=f"Sort by fields (comma-separated, prefix with '-' for descending). Available: {', '.join(sort_fields)}. Example: -date,name",
                )
            )

        if paginate_enabled:
            parameters.extend(
                [
                    OpenApiParameter(
                        name="page",
                        type=OpenApiTypes.INT,
                        location=OpenApiParameter.QUERY,
                        required=False,
                        description="A page number within the paginated result set.",
                    ),
                    OpenApiParameter(
                        name="page_size",
                        type=OpenApiTypes.INT,
                        location=OpenApiParameter.QUERY,
                        required=False,
                        description="Number of results to return per page.",
                    ),
                ]
            )

        parameters.append(
            OpenApiParameter(
                name="query",
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                required=False,
                description=(
                    "Advanced JSON-based filtering payload (Stringified). "
                    "Supports nested {'AND': [...]}, {'OR': [...]}, and "
                    "Cross-field/Self-references using {'F': {'field__lt': 'other_field'}}."
                ),
            )
        )

        def parse_filter_entry(entry):
            if isinstance(entry, dict):
                param = entry.get("param") or entry.get("name") or entry.get("params")
                model_field = entry.get("model_field") or entry.get("field")
                opts = {
                    "multi_csv": bool(entry.get("multi_csv") or entry.get("csv")),
                    "multi_param": bool(entry.get("multi_param") or entry.get("multi")),
                    "choices": entry.get("choices") or entry.get("enum"),
                }
                if param and not model_field:
                    model_field = param
                return param, model_field, opts
            if isinstance(entry, str):
                if ":" in entry:
                    left, right = entry.split(":", 1)
                    return (
                        left.strip(),
                        right.strip(),
                        {
                            "multi_csv": False,
                            "multi_param": False,
                        },
                    )
                return (
                    entry.strip(),
                    entry.strip(),
                    {
                        "multi_csv": False,
                        "multi_param": False,
                    },
                )
            if isinstance(entry, (list, tuple)):
                if len(entry) == 2:
                    return (
                        entry[0],
                        entry[1],
                        {
                            "multi_csv": False,
                            "multi_param": False,
                        },
                    )
                if len(entry) >= 3:
                    cfg = entry[2]
                    if isinstance(cfg, bool):
                        return (
                            entry[0],
                            entry[1],
                            {
                                "multi_csv": cfg,
                                "multi_param": False,
                            },
                        )
                    if isinstance(cfg, dict):
                        return (
                            entry[0],
                            entry[1],
                            {
                                "multi_csv": bool(
                                    cfg.get("multi_csv") or cfg.get("csv")
                                ),
                                "multi_param": bool(
                                    cfg.get("multi_param") or cfg.get("multi")
                                ),
                                "choices": cfg.get("choices") or cfg.get("enum"),
                            },
                        )
                    return (
                        entry[0],
                        entry[1],
                        {
                            "multi_csv": False,
                            "multi_param": False,
                        },
                    )
            return None, None, {"multi_csv": False, "multi_param": False}

        filter_fields = []
        base_filter_fields = getattr(dummy_instance, "filter_fields", [])
        if base_filter_fields:
            filter_fields.extend(base_filter_fields)
        filter_fields_config = getattr(dummy_instance, "filter_fields_config", None)
        if filter_fields_config:
            filter_fields.extend(filter_fields_config)

        if model_class and filter_fields:
            for entry in filter_fields:
                param, field_name, opts = parse_filter_entry(entry)
                if not param or not field_name:
                    continue
                param_list = param if isinstance(param, (list, tuple)) else [param]
                for param_name in param_list:
                    enum_values = None
                    param_type = OpenApiTypes.STR

                    try:
                        field = model_class._meta.get_field(field_name)

                        if isinstance(field, models.BooleanField):
                            param_type = OpenApiTypes.BOOL
                            enum_values = [True, False]
                        elif isinstance(
                            field,
                            (
                                models.IntegerField,
                                models.AutoField,
                                models.BigIntegerField,
                            ),
                        ):
                            param_type = OpenApiTypes.INT
                        elif isinstance(
                            field, (models.FloatField, models.DecimalField)
                        ):
                            param_type = OpenApiTypes.FLOAT
                        elif isinstance(field, models.UUIDField):
                            param_type = OpenApiTypes.UUID
                        elif isinstance(field, models.DateTimeField):
                            param_type = OpenApiTypes.DATETIME
                        elif isinstance(field, models.DateField):
                            param_type = OpenApiTypes.DATE
                        elif isinstance(
                            field,
                            (
                                models.ForeignKey,
                                models.OneToOneField,
                                models.ManyToManyField,
                            ),
                        ):
                            param_type = OpenApiTypes.UUID

                        if field.choices:
                            enum_values = [choice[0] for choice in field.choices]

                    except Exception:
                        param_type = get_model_field_type(model_class, field_name)
                    choices_override = opts.get("choices")
                    if choices_override not in (None, True, "auto"):
                        enum_values = list(choices_override)

                    description = f"Filter by {field_name}"
                    if opts.get("multi_csv") and opts.get("multi_param"):
                        description += (
                            f". Multiple values supported via `{param_name}=a,b` "
                            "or repeated params"
                        )
                    elif opts.get("multi_csv"):
                        description += (
                            f". Multiple values supported via `{param_name}=a,b`"
                        )
                    elif opts.get("multi_param"):
                        description += ". Multiple values supported via repeated params"

                    parameters.append(
                        OpenApiParameter(
                            name=param_name,
                            type=param_type,
                            location=OpenApiParameter.QUERY,
                            required=False,
                            description=description,
                            enum=enum_values,
                        )
                    )

        # Document filter_schema fields with lookup-suffixed params
        filter_schema = getattr(dummy_instance, "filter_schema", None)
        if filter_schema and hasattr(filter_schema, "fields"):
            _type_map = {
                str: OpenApiTypes.STR,
                int: OpenApiTypes.INT,
                float: OpenApiTypes.FLOAT,
                bool: OpenApiTypes.BOOL,
            }
            # Collect already-documented param names to avoid duplicates
            documented_params = {p.name for p in parameters}

            for field_name, field_meta in filter_schema.fields.items():
                param_type = _type_map.get(field_meta.type, OpenApiTypes.STR)
                for lookup in field_meta.lookups:
                    param_name = field_name if lookup == "exact" else f"{field_name}__{lookup}"
                    if param_name in documented_params:
                        continue
                    description = f"Filter by {field_name}"
                    if lookup != "exact":
                        description += f" ({lookup})"
                    parameters.append(
                        OpenApiParameter(
                            name=param_name,
                            type=param_type,
                            location=OpenApiParameter.QUERY,
                            required=False,
                            description=description,
                        )
                    )

        extra_query_params = getattr(dummy_instance, "extra_query_params", [])
        for param in extra_query_params:
            parameters.append(
                OpenApiParameter(
                    name=param["name"],
                    type=getattr(
                        OpenApiTypes, param.get("type", "STR").upper(), OpenApiTypes.STR
                    ),
                    location=OpenApiParameter.QUERY,
                    required=param.get("required", False),
                    description=param.get("description", ""),
                )
            )

        return parameters

    def wrap(method, method_name):
        """Wrap method with OpenAPI schema."""

        @wraps(method)
        def wrapped_method(self, *args, **kwargs):
            return method(self, *args, **kwargs)

        schema_kwargs = {
            "tags": tag,
            "summary": f"{method_name.upper()} {entity_name}",
        }

        dummy_instance = cls()

        permission_info = extract_permission_info(method)
        permission_description = format_permission_description(permission_info)

        method_docstring = method.__doc__
        if method_docstring:
            method_docstring = method_docstring.strip()

        if method_name == "get":
            is_detail_view = "pk" in method.__code__.co_varnames
            action = "detail" if is_detail_view else "list"
            serializer = resolve_serializer(dummy_instance, action=action)
            parameters = build_get_parameters(dummy_instance)

            responses = {}
            if serializer:
                if is_detail_view:
                    responses[200] = OpenApiResponse(
                        response=create_response_wrapper_schema(serializer),
                        description="Success response with single object",
                    )
                elif paginate_enabled:
                    responses[200] = OpenApiResponse(
                        response=create_response_wrapper_schema(
                            serializer, is_list=True, is_paginated=True
                        ),
                        description="Paginated list response",
                    )
                else:
                    responses[200] = OpenApiResponse(
                        response=create_response_wrapper_schema(
                            serializer, is_list=True
                        ),
                        description="Success response with data array",
                    )
            else:
                responses[200] = OpenApiResponse(description="Success")

            if not is_detail_view:
                responses[204] = OpenApiResponse(
                    response={
                        "type": "object",
                        "properties": {
                            "success": {"type": "boolean", "example": True},
                            "message": {
                                "type": "string",
                                "example": "No data found",
                            },
                        },
                    },
                    description="No content found (empty queryset)",
                )

            if is_detail_view:
                responses[404] = OpenApiResponse(
                    response={
                        "type": "object",
                        "properties": {
                            "success": {"type": "boolean", "example": False},
                            "message": {
                                "type": "string",
                                "example": f"{entity_name} not found",
                            },
                        },
                    },
                    description="Resource not found",
                )

            if permission_info:
                error_msg = permission_info.get("error_message", "Permission denied")
                responses[403] = OpenApiResponse(
                    response={
                        "type": "object",
                        "properties": {
                            "success": {"type": "boolean", "example": False},
                            "message": {
                                "type": "string",
                                "example": error_msg,
                            },
                        },
                    },
                    description="Permission denied",
                )

            description = (
                method_docstring
                if method_docstring
                else f"{'Retrieve a single' if is_detail_view else 'Retrieve list of'} {entity_name.lower()} record{'s' if not is_detail_view else ''}."
            )

            if not is_detail_view and not method_docstring:
                param_hints = []
                search_fields_list = getattr(dummy_instance, "search_fields", [])
                sort_mapping = getattr(dummy_instance, "sort_field_mapping", {})
                allowed_sorts = getattr(dummy_instance, "allowed_sort_fields", [])
                filter_fields_list = getattr(dummy_instance, "filter_fields", [])

                if search_fields_list:
                    param_hints.append(f"search across {', '.join(search_fields_list)}")
                if sort_mapping or allowed_sorts:
                    param_hints.append("sort results")
                if filter_fields_list:
                    param_hints.append("filter by specific fields")
                if paginate_enabled:
                    param_hints.append("paginate results")

                if param_hints:
                    description += f"\n\nSupports: {', '.join(param_hints)}."

            if permission_description:
                description += f"\n\n---\n\n## 🔒 Permission Requirements\n\n{permission_description}"

            view_id = getattr(dummy_instance, "view_id", None)
            if view_id:
                description += (
                    f"\n\n---\n\n## ⚙️ View Configuration\n\n**View ID:** `{view_id}`"
                )

            schema_kwargs.update(
                {
                    "parameters": parameters,
                    "responses": responses,
                    "description": description,
                }
            )

        elif method_name in ["post", "put", "patch"]:
            action_map = {"post": "create", "put": "update", "patch": "patch"}
            action = action_map[method_name]
            serializer = resolve_serializer(
                dummy_instance, is_create_update=True, action=action
            )
            response_serializer = resolve_response_serializer(
                dummy_instance, default_serializer=serializer
            )

            status_code = 201 if method_name == "post" else 200
            responses = {}

            if response_serializer:
                responses[status_code] = OpenApiResponse(
                    response=create_response_wrapper_schema(
                        response_serializer,
                        is_list=bool(
                            getattr(dummy_instance, "response_serializer_many", False)
                        ),
                    ),
                    description=f"{'Created' if method_name == 'post' else 'Updated'} successfully",
                )

            responses[422] = OpenApiResponse(
                response={
                    "type": "object",
                    "properties": {
                        "success": {"type": "boolean", "example": False},
                        "message": {"type": "string", "example": "Validation failed"},
                        "details": {
                            "type": "object",
                            "properties": {
                                "errors": {
                                    "type": "object",
                                    "additionalProperties": {
                                        "type": "array",
                                        "items": {"type": "string"},
                                    },
                                    "example": {
                                        "field_name": ["This field is required."],
                                        "email": ["Enter a valid email address."],
                                    },
                                }
                            },
                        },
                    },
                },
                description="Validation failed",
            )

            if method_name in ["put", "patch"]:
                responses[404] = OpenApiResponse(
                    response={
                        "type": "object",
                        "properties": {
                            "success": {"type": "boolean", "example": False},
                            "message": {
                                "type": "string",
                                "example": f"{entity_name} not found",
                            },
                        },
                    },
                    description="Resource not found",
                )

            if method_name == "post":
                responses[400] = OpenApiResponse(
                    response={
                        "type": "object",
                        "properties": {
                            "success": {"type": "boolean", "example": False},
                            "message": {
                                "type": "string",
                                "example": "No data in request",
                            },
                            "details": {
                                "type": "object",
                                "properties": {"error": {"type": "string"}},
                            },
                        },
                    },
                    description="Bad request (no data provided)",
                )

            if permission_info:
                error_msg = permission_info.get("error_message", "Permission denied")
                responses[403] = OpenApiResponse(
                    response={
                        "type": "object",
                        "properties": {
                            "success": {"type": "boolean", "example": False},
                            "message": {
                                "type": "string",
                                "example": error_msg,
                            },
                        },
                    },
                    description="Permission denied",
                )

            responses[500] = OpenApiResponse(
                response={
                    "type": "object",
                    "properties": {
                        "success": {"type": "boolean", "example": False},
                        "message": {
                            "type": "string",
                            "example": "An error occurred while creating the record.",
                        },
                        "details": {
                            "type": "object",
                            "properties": {"error": {"type": "string"}},
                        },
                    },
                },
                description="Internal server error",
            )

            action_text = {
                "post": "Create a new",
                "put": "Update an existing",
                "patch": "Partially update an existing",
            }
            description = (
                method_docstring
                if method_docstring
                else f"{action_text[method_name]} {entity_name.lower()} record."
            )

            if not method_docstring:
                validation_hooks = {
                    "post": "validate_create",
                    "put": "validate_update",
                    "patch": "validate_update and validate_patch",
                }
                description += f"\n\nValidation: {validation_hooks[method_name]}() hook will be called before processing."

            if permission_description:
                description += f"\n\n---\n\n### 🔒 Permission Requirements\n\n{permission_description}"

            view_id = getattr(dummy_instance, "view_id", None)
            if view_id:
                description += (
                    f"\n\n---\n\n## ⚙️ View Configuration\n\n**View ID:** `{view_id}`"
                )
            existing_schema = getattr(method, "extend_schema", None)
            schema_kwargs.update(
                {
                    **({} if existing_schema else {"request": serializer}),
                    "responses": responses,
                    "description": description,
                }
            )

        elif method_name == "delete":
            delete_type = (
                "Soft delete" if supports_soft_delete else "Permanently delete"
            )
            description = (
                method_docstring
                if method_docstring
                else f"{delete_type} a {entity_name.lower()} record."
            )

            if not method_docstring:
                description += "\n\nValidation: validate_delete() hook will be called before deletion."

            if permission_description:
                description += f"\n\n---\n\n### 🔒 Permission Requirements\n\n{permission_description}"

            view_id = getattr(dummy_instance, "view_id", None)
            if view_id:
                description += (
                    f"\n\n---\n\n## ⚙️ View Configuration\n\n**View ID:** `{view_id}`"
                )

            responses = {
                200: OpenApiResponse(
                    response={
                        "type": "object",
                        "properties": {
                            "success": {"type": "boolean", "example": True},
                            "message": {
                                "type": "string",
                                "example": "Deleted successfully",
                            },
                        },
                    },
                    description="Deleted successfully",
                ),
                404: OpenApiResponse(
                    response={
                        "type": "object",
                        "properties": {
                            "success": {"type": "boolean", "example": False},
                            "message": {
                                "type": "string",
                                "example": f"{entity_name} not found",
                            },
                        },
                    },
                    description="Resource not found",
                ),
                500: OpenApiResponse(
                    response={
                        "type": "object",
                        "properties": {
                            "success": {"type": "boolean", "example": False},
                            "message": {
                                "type": "string",
                                "example": "An error occurred while deleting the record.",
                            },
                            "details": {
                                "type": "object",
                                "properties": {"error": {"type": "string"}},
                            },
                        },
                    },
                    description="Internal server error",
                ),
            }

            if permission_info:
                error_msg = permission_info.get("error_message", "Permission denied")
                responses[403] = OpenApiResponse(
                    response={
                        "type": "object",
                        "properties": {
                            "success": {"type": "boolean", "example": False},
                            "message": {
                                "type": "string",
                                "example": error_msg,
                            },
                        },
                    },
                    description="Permission denied",
                )

            schema_kwargs.update(
                {
                    "responses": responses,
                    "description": description,
                }
            )

        return extend_schema(**schema_kwargs)(wrapped_method)

    for method_name in ["get", "post", "put", "patch", "delete"]:
        if hasattr(cls, method_name):
            original_method = getattr(cls, method_name)
            
            # Logic to hide methods based on context to prevent "Swagger Mess"
            def get_method_schema(method_name, is_detail):
                if is_detail and method_name == "post":
                    return extend_schema(exclude=True)
                if not is_detail and method_name in ["put", "patch", "delete"]:
                    return extend_schema(exclude=True)
                return None

            # We use a custom wrapper that spectacular can introspect
            setattr(cls, method_name, wrap(original_method, method_name))

    return cls


def auto_extend_choice_schema(cls):
    """
    Automatic OpenAPI schema generation for BaseChoicesAPIView subclasses.
    """
    entity_name = getattr(cls, "entity_name", None) or cls.__name__.replace(
        "ChoicesAPIView", ""
    )
    model = getattr(cls, "model", None)
    field_names = getattr(cls, "field_names", []) or [getattr(cls, "field_name", "")]
    field_names = [f for f in field_names if f]

    if not model or not field_names:
        return cls

    # Define Choice Schema locally to avoid circular imports
    class InternalChoiceSerializer(serializers.Serializer):
        value = serializers.CharField()
        label = serializers.CharField()

    def wrap_get(method):
        @wraps(method)
        def wrapped_method(self, *args, **kwargs):
            return method(self, *args, **kwargs)

        # Construct response schema
        if len(field_names) == 1:
            response_schema = inline_serializer(
                name=f"{entity_name}ChoiceResponse",
                fields={
                    "success": serializers.BooleanField(default=True),
                    "message": serializers.CharField(
                        default="Choices fetched successfully"
                    ),
                    "data": InternalChoiceSerializer(many=True),
                },
            )
        else:
            fields = {
                f"{field}_choices": InternalChoiceSerializer(many=True)
                for field in field_names
            }
            nested_data_serializer = inline_serializer(
                name=f"{entity_name}MultiChoiceData", fields=fields
            )
            response_schema = inline_serializer(
                name=f"{entity_name}MultiChoiceResponse",
                fields={
                    "success": serializers.BooleanField(default=True),
                    "message": serializers.CharField(
                        default="Choices fetched successfully"
                    ),
                    "data": nested_data_serializer,
                },
            )

        if len(field_names) > 1:
            parameters = [
                OpenApiParameter(
                    name="field",
                    type=OpenApiTypes.STR,
                    location=OpenApiParameter.QUERY,
                    required=False,
                    enum=field_names,
                    description="Filter to select only one specific choice field.",
                )
            ]
        else:
            parameters = []

        description = f"Retrieve choices for {entity_name} fields: {', '.join(f'`{f}`' for f in field_names)}."

        return extend_schema(
            summary=f"Get {entity_name} Choices",
            description=description,
            tags=[entity_name],
            parameters=parameters,
            responses={200: OpenApiResponse(response=response_schema)},
        )(wrapped_method)

    if hasattr(cls, "get"):
        cls.get = wrap_get(cls.get)

    return cls