import logging
from typing import Any, Optional, Type, Dict, List
from django.db.models import Q

from django.db import transaction
from django.db.models import Model
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework.views import APIView


from core.admin.helpers.model_helpers import build_tenant_filter, get_object_with_scoping
from core.admin.helpers.pagination_helpers import StandardResultsSetPagination, paginate_queryset
from core.admin.helpers.query_helpers import filter_queryset
from core.admin.helpers.response_helpers import ResponseFactory
from core.admin.helpers.serializer_helpers import (
    get_related_fields_from_serializer,
    optimize_queryset_with_serializer,
)
from core.admin.helpers.bulk_helpers import (
    BulkHooks,
    BulkResult,
    OperationContext,
    bulk_create,
    should_offload,
)
from core.admin.helpers.cache_helpers import (
    get_serializer_cache_key,
    get_cached_serializer_data,
    set_cached_serializer_data,
    invalidate_serializer_cache,
)
from core.admin.throttling import TenantDynamicThrottle  # noqa: DAG — used as class attr throttle_classes = [...]
from core.admin.decorators.openai_swagger import PlatformOpenAISchema  # noqa: DAG — used as class attr schema = PlatformOpenAISchema()
from core.admin.utils.integrity.log_mixin import LogMixin as SystemLogMixin


from core.base_views.contracts import IPublicContract

# --------------------------
# Architectural Contracts
# --------------------------

class ViewContractMixin(IPublicContract):
    """
    Implementation of the View Public Contract.
    Safe-wraps the Django request and user for use in mixins.
    """
    @property
    def platform_request(self) -> Optional[Any]:
        return getattr(self, "request", None)

    @property
    def platform_user(self) -> Any:
        req = self.platform_request
        return getattr(req, "user", None) if req else None


# --------------------------
# Mixins for Base API
# --------------------------

class SerializerMixin(ViewContractMixin):
    serializer_class = None
    list_detail_serializer_class = None
    create_update_serializer_class = None
    list_serializer_class = None
    detail_serializer_class = None
    create_serializer_class = None
    update_serializer_class = None
    select_serializer_class = None

    def get_serializer_class(self, is_create_update: bool = False, action: str | None = None):
        """
        Industrialized Serializer Selection:
        Priority: Specialized (Action) -> create_update_serializer -> generic serializer_class.
        """
        # 1. Handle Selection Context (Dropdowns)
        request = self.platform_request
        is_select = request.headers.get("Is-Select-Option") == "true" if request else False
        if is_select and getattr(self, "select_serializer_class", None):
            return self.select_serializer_class

        # 2. Handle Mutation Context (Create/Update/Patch)
        if is_create_update:
            if action == "create" and getattr(self, "create_serializer_class", None):
                return self.create_serializer_class
            if action in ["update", "patch"] and getattr(self, "update_serializer_class", None):
                return self.update_serializer_class
            
            # Fallback for mutation
            return (
                getattr(self, "create_update_serializer_class", None) or 
                getattr(self, "create_serializer_class", None) or 
                self.serializer_class
            )

        # 3. Handle Retrieval Context (List/Detail)
        if action == "list" and getattr(self, "list_serializer_class", None):
            return self.list_serializer_class
        if action == "detail" and getattr(self, "detail_serializer_class", None):
            return self.detail_serializer_class
        
        # Fallback for retrieval
        return (
            getattr(self, "list_detail_serializer_class", None) or 
            getattr(self, "detail_serializer_class", None) or 
            self.serializer_class
        )

    def get_serializer_context(self) -> dict[str, Any]:
        """
        Build context for serializers, including Validation Mode.
        """
        request = self.platform_request
        query_params = getattr(request, "query_params", {}) if request else {}
        context = {"request": request, "query_params": query_params}

        # GoF: Determine Validation Mode Context
        if request:
            if request.method == "POST":
                context["validation_mode"] = "create"
            elif request.method in ["PUT", "PATCH"]:
                context["validation_mode"] = "update"

            # Support explicit override if needed
            mode_override = query_params.get("validation_mode")
            if mode_override:
                context["validation_mode"] = mode_override

            # Industrialized Context: Platform & Explain
            context["platform"] = request.headers.get("X-Platform", "web")
            context["explain"] = query_params.get("explain", "false").lower() == "true"

        return context

    def get_serializer(self, *args, **kwargs):
        """
        Industrialized Serializer Bridge:
        Instantiates the resolved serializer class with platform context.
        """
        is_create_update = kwargs.pop("is_create_update", False)
        action = kwargs.pop("action", None)
        
        serializer_class = self.get_serializer_class(
            is_create_update=is_create_update, action=action
        )

        if serializer_class is None:
            raise AttributeError(
                f"View '{self.__class__.__name__}' is missing a 'serializer_class'. "
                f"Please define one or provide a specialized '{action}_serializer_class'."
            )

        kwargs.setdefault("context", self.get_serializer_context())
        return serializer_class(*args, **kwargs)

    def init_serializer(self, *args, action: str | None = None, **kwargs):
        """Legacy helper for internal use."""
        return self.get_serializer(*args, action=action, **kwargs)


class ObjectMixin(ViewContractMixin):
    model: Model | None = None
    supports_soft_delete: bool = True

    def get_object(self, pk: Any, include_deleted=False, use_create_serializer=False):
        """
        Retrieve a single object with scoping and optimization.
        """
        return get_object_with_scoping(
            model=self.model,
            pk=pk,
            user=self.platform_user,
            include_deleted=include_deleted,
            supports_soft_delete=self.supports_soft_delete
        )


class QueryMixin(SerializerMixin):
    model: Model | None = None
    orderby: str = "-created_at"
    search_fields: list[str] = []
    filter_fields: list[tuple[str, str]] = []
    filter_schema = None  # FilterSchema instance for type coercion and validation
    paginate: bool = False
    page_size: int = 20
    supports_soft_delete: bool = True
    pagination_class = StandardResultsSetPagination

    def get_base_queryset(self):
        """
        Hook to customize the initial queryset (e.g., select_related).
        """
        return self.model.objects.all()

    def _get_queryset(
        self,
        include_deleted=False,
        search_query=None,
        field_search=None,
        query=None,
        use_create_serializer=False,
    ):
        request = self.platform_request
        query_params = getattr(request, "query_params", {}) if request else {}
        queryset = self.get_base_queryset()
        
        # 1. Multi-Tenant Scoping (Bypass for Superusers)
        tenant_q = build_tenant_filter(self.model, self.platform_user)
        if tenant_q:
            queryset = queryset.filter(tenant_q)

        # 2. Performance: Soft Delete & Pre-fetch
        if (
            hasattr(self.model, "is_deleted")
            and not include_deleted
            and self.supports_soft_delete
        ):
            queryset = queryset.filter(is_deleted=False)

        serializer_class = self.get_serializer_class(
            is_create_update=use_create_serializer, action="list"
        )
        if serializer_class:
            sel_rel, pre_rel = get_related_fields_from_serializer(serializer_class)
            if sel_rel:
                queryset = queryset.select_related(*sel_rel)
            if pre_rel:
                queryset = queryset.prefetch_related(*pre_rel)

        # 3. Filtering & Dynamic Sorting (Q/F Engine)
        sort_query = query_params.get("sort")
        queryset = filter_queryset(
            queryset,
            search_fields=getattr(self, "search_fields", []),
            search_query=search_query,
            filter_fields=getattr(self, "filter_fields", []),
            filter_schema=getattr(self, "filter_schema", None),
            field_search=field_search,
            sort_query=sort_query,
            query=query,
            logger=getattr(self, "logger", None),
        )

        # Fallback to default orderby if no dynamic sort
        if not sort_query and hasattr(self, "orderby"):
            queryset = queryset.order_by(self.orderby)

        return queryset


logger = logging.getLogger(__name__)

class AuditLogMixin(ViewContractMixin):
    """
    Industrialized Audit Trail for Views:
    Automatically logs mutations (Create, Update, Delete) using the Model's AuditMixin.
    """
    audit_enabled = True

    def _log_audit_entry(self, instance, action, changes=None, reason=None):
        if not self.audit_enabled or not hasattr(instance, 'create_audit_log'):
            return
        
        request = self.platform_request
        query_params = getattr(request, "query_params", {}) if request else {}
        method = getattr(request, "method", "UNKNOWN") if request else "UNKNOWN"

        # Capture reason only if ?explain=true is present
        explain_mode = query_params.get("explain", "false").lower() == "true"
        trigger_reason = reason or f"API {method} via {self.__class__.__name__}" if explain_mode else None
            
        instance.create_audit_log(action, reason=trigger_reason)

class BaseAPIView(QueryMixin, ObjectMixin, AuditLogMixin, SystemLogMixin, APIView):
    schema = PlatformOpenAISchema()
    throttle_classes = [TenantDynamicThrottle]
    entity_name: str | None = None
    entity_display_field: Any = None
    entity_display_format: str | None = None

    @classmethod
    def as_view(cls, **initkwargs):
        """
        Industrialized View Initialization:
        Automatically masks allowed HTTP methods based on URL hints (HTTP_METHOD).
        This perfectly cleans up Swagger UI and hardens security.
        """
        # If the URL pattern provides explicit method hints, respect them absolutely
        if "HTTP_METHOD" in initkwargs:
            initkwargs["http_method_names"] = [
                m.lower() for m in initkwargs["HTTP_METHOD"]
            ]

        return super().as_view(**initkwargs)

    def _validate_tenant_integrity(self):
        """
        Industrialized Security: Ensure the Session Company matches the JWT Claim.
        Prevents session hijacking or "Tenant Drifting" if a user switches accounts.
        """
        user = self.request.user
        if not user.is_authenticated or user.is_superuser:
            return

        # 1. Get IDs from Session
        session_company = self.request.session.get("company_id")
        
        # 2. Get IDs from JWT Claims (if available)
        # DRF-SimpleJWT puts the token in request.auth
        jwt_company = None
        auth_obj = getattr(self.request, "auth", None)
        if auth_obj:
            if isinstance(auth_obj, dict):
                jwt_company = auth_obj.get("company_id")
            elif hasattr(auth_obj, "get"):
                jwt_company = auth_obj.get("company_id")

        # 3. Validation Logic
        if jwt_company and session_company and str(jwt_company) != str(session_company):
            self.logger.warning(
                f"Tenant Mismatch detected for User {user.id}! "
                f"JWT: {jwt_company} | Session: {session_company}. Terminating request."
            )
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Security Integrity Failure: Tenant mismatch between Token and Session.")

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        app_name = (
            self.__module__.split(".")[0] if "." in self.__module__ else "base_api"
        )
        self.logger = logging.getLogger(f"api.{app_name}")
        self._pagination_class = None

    def __init_subclass__(cls, **kwargs):
        """
        Industrial Automation: Automatically apply OpenAPI schema generation
        to all subclasses of BaseAPIView.
        """
        super().__init_subclass__(**kwargs)
        from core.admin.decorators.openai_swagger import auto_extend_schema
        auto_extend_schema(cls)

    @property
    def _bulk_hooks(self) -> BulkHooks:
        """Build BulkHooks from the view's hook methods with request bound."""
        request = getattr(self, 'request', None)
        return BulkHooks(
            pre_create=(lambda data: self.pre_create(request, data)) if request else None,
            post_create=self.post_create,
            perform_create=self.perform_create,
            pre_update=(lambda obj, data: self.pre_update(request, obj, data)) if request else None,
            post_update=self.post_update,
            perform_update=self.perform_update,
            pre_delete=(lambda obj: self.pre_delete(request, obj)) if request else None,
            post_delete=self.post_delete,
            perform_destroy=self.perform_destroy,
        )

    @property
    def _async_hook_names(self) -> list[str]:
        """Hook names to run in the Celery worker (non-request-dependent)."""
        return ["post_create", "post_update"]

    @property
    def auth_service(self):
        """Industrialized Lazy Loader: Provides IAuthenticationClassService."""
        if not hasattr(self, "_cached_auth_service"):
            from apps.users.services.auth_service import AuthService
            self._cached_auth_service = AuthService()
        return self._cached_auth_service

    def get_display_name(self, instance):
        return get_display_name(
            instance,
            display_field=self.entity_display_field,
            display_format=self.entity_display_format,
            logger=self.logger,
        )

    def get_pagination_class(self):
        """
        Choose between Cursor and PageNumber pagination dynamically.
        """
        if "cursor" in self.request.query_params:
            from core.admin.helpers.pagination_helpers import IndustrialCursorPagination
            return IndustrialCursorPagination
        
        # Default to Standard PageNumber pagination with dynamic page_size
        if not self._pagination_class:
            class CustomPagination(self.pagination_class):
                page_size = self.page_size
            self._pagination_class = CustomPagination
            
        return self._pagination_class

    def paginate_queryset(self, queryset, request):
        return paginate_queryset(self.get_pagination_class(), queryset, request, self)

    # -------------------
    # Hooks Architecture
    # -------------------
    def pre_create(self, request, data):
        """Hook to manipulate data before create validation."""
        return data

    def perform_create(self, serializer):
        """Hook to perform the actual save of the creation."""
        return serializer.save()

    def _build_operation_context(
        self, action: str, *,
        extra_serializer_context: dict | None = None,
    ) -> OperationContext:
        request = getattr(self, 'request', None)
        ser_ctx = self.get_serializer_context()
        if extra_serializer_context:
            ser_ctx.update(extra_serializer_context)

        company_id = None
        branch_id = None
        if request and hasattr(request, 'session'):
            company_id = request.session.get("company_id")
            branch_id = request.session.get("branch_id")

        return OperationContext(
            model=self.model,
            serializer_class=self.get_serializer_class(is_create_update=True, action=action),
            serializer_context=ser_ctx,
            hooks=self._bulk_hooks,
            get_object_fn=(lambda pk: self.get_object(pk)) if action in ("update", "delete") else None,
            supports_soft_delete=self.supports_soft_delete,
            company_id=company_id,
            branch_id=branch_id,
            hook_names=self._async_hook_names,
        )

    def post_create(self, instance):
        """Industrialized: Automatically log creation and invalidate cache."""
        self._log_audit_entry(instance, "create", changes={"status": "initial_creation"})
        self._invalidate_instance_cache(instance)

    def pre_update(self, request, instance, data):
        """Hook to manipulate data before update validation."""
        return data

    def perform_update(self, serializer):
        """Hook to perform the actual save of an update."""
        return serializer.save()

    def post_update(self, instance):
        """Industrialized: Automatically log update and invalidate cache."""
        self._log_audit_entry(instance, "update", changes={"status": "updated"})
        self._invalidate_instance_cache(instance)

    def pre_delete(self, request, instance, *args, **kwargs):
        """Industrialized: Capture state before deletion."""
        self._log_audit_entry(instance, "delete", changes={"status": "pending_deletion"})

    def perform_destroy(self, instance):
        """Hook to perform the actual deletion (soft or hard)."""
        if self.supports_soft_delete and hasattr(instance, "soft_delete"):
            instance.soft_delete()
        else:
            instance.delete()

    def post_delete(self, instance):
        """Hook for side-effects after deletion."""
        self._invalidate_instance_cache(instance)

    def pre_mutation(self, request):
        """Hook before a mutation operation."""
        pass

    def _invalidate_instance_cache(self, instance):
        """Invalidate cached serializer data for a specific instance."""
        user = self.platform_user
        if user and hasattr(instance, "pk") and instance.pk:
            invalidate_serializer_cache(user.id, instance.__class__.__name__, instance.pk)

    # -------------------
    # CRUD Methods
    # -------------------
    def get(self, request, *args, pk=None, **kwargs):
        self._validate_tenant_integrity()
        use_create_serializer = (
            request.query_params.get("update", "false").lower() == "true"
        )
        is_select = request.headers.get("Is-Select-Option", "").lower() == "true"
        action = "detail" if pk else "list"

        serializer_class = self.get_serializer_class(
            is_create_update=use_create_serializer, action=action
        )

        if pk:
            # Redis Cache Lookup
            fields = request.query_params.get("fields")
            cache_key = get_serializer_cache_key(request.user.id, self.model.__name__, pk, fields)
            cached_data = get_cached_serializer_data(cache_key)
            if cached_data:
                return ResponseFactory.success(message="Fetched from cache", data=cached_data)

            obj = self.get_object(pk, use_create_serializer=use_create_serializer)
            if not obj:
                return ResponseFactory.not_found(f"{self.entity_name or 'Record'} not found")
            
            serializer = self.get_serializer(obj, action="detail", is_create_update=use_create_serializer)
            data = serializer.data
            set_cached_serializer_data(cache_key, data)
            
            return ResponseFactory.success(message="Fetched successfully", data=data)

        queryset = self._get_queryset(
            include_deleted=request.query_params.get("deleted") == "true",
            search_query=request.query_params.get("search"),
            query=request.query_params.get("query"),
            field_search={
                k: v
                for k, v in request.query_params.items()
                if k not in {
                    "search", "deleted", "update", "page", "page_size", "cursor",
                    "sort", "fields", "query", "select_limit", "ids", "selected_ids",
                    "include_ids", "export", "export_format", "export_mode", "explain",
                }
            },
            use_create_serializer=use_create_serializer,
        )

        if self.paginate and not is_select:
            paginated, paginator = self.paginate_queryset(queryset, request)
            if paginated is None:
                return ResponseFactory.no_content()
            serializer = self.get_serializer(paginated, many=True, action="list")
            return paginator.get_paginated_response(serializer.data)

        # Non-paginated path: check existence efficiently
        if not queryset.exists():
            return ResponseFactory.no_content()

        serializer = self.get_serializer(
            queryset, 
            many=True, 
            action="list", 
            is_create_update=use_create_serializer
        )
        return ResponseFactory.success(
            message="Fetched successfully",
            data=serializer.data,
        )

    def post(self, request, *args, **kwargs):
        self._validate_tenant_integrity()
        self.pre_mutation(request)

        if not request.data:
            return ResponseFactory.error(details={"error": "No data in request"})

        is_many = isinstance(request.data, list)

        # ASYNC PATH: bulk create above threshold
        if is_many and should_offload(request.data):
            context = self._build_operation_context("create")
            from core.admin.tasks.bulk_tasks import bulk_create_task
            task = bulk_create_task.delay(request.data, context.to_dict())
            return ResponseFactory.accepted(
                message=f"Bulk create queued ({len(request.data)} records)",
                data={
                    "task_id": task.id,
                    "status_url": f"/api/admin/operations/{task.id}/",
                },
            )

        # SYNC PATH: single record or small bulk
        context = self._build_operation_context("create")
        result: BulkResult = bulk_create(data=request.data, context=context)

        if not result.success:
            return (
                ResponseFactory.validation_error(errors=result.errors)
                if result.errors
                else ResponseFactory.server_error("Create failed")
            )

        return ResponseFactory.created(
            message="Created successfully",
            data=result.data,
            meta=result.meta or {},
        )

    def put(self, request, *args, pk=None, **kwargs):
        self._validate_tenant_integrity()
        self.pre_mutation(request)
        is_many = isinstance(request.data, list) and pk is None

        if pk:
            # Single Update — always sync
            obj = self.get_object(pk)
            if not obj:
                return ResponseFactory.not_found(f"{self.entity_name or 'Record'} not found")

            data = self.pre_update(request, obj, request.data)
            serializer = self.get_serializer(
                obj, data=data, partial=True, is_create_update=True, action="update"
            )
            if not serializer.is_valid():
                return ResponseFactory.validation_error(errors=serializer.errors)

            with transaction.atomic():
                instance = self.perform_update(serializer)
                self.post_update(instance)
            return ResponseFactory.success(
                message="Updated successfully",
                data=self.get_serializer(instance, action="detail").data,
            )

        elif is_many:
            # Bulk Update — always async (multi-object mutation)
            context = self._build_operation_context("update")
            from core.admin.tasks.bulk_tasks import bulk_update_task
            task = bulk_update_task.delay(request.data, context.to_dict())
            return ResponseFactory.accepted(
                message=f"Bulk update queued ({len(request.data)} records)",
                data={
                    "task_id": task.id,
                    "status_url": f"/api/admin/operations/{task.id}/",
                },
            )

        return ResponseFactory.error("Invalid request for update. Provide a PK or a list of items.")
    
    def patch(self, request, *args, pk=None, **kwargs):
        """Standard PATCH delegating to PUT (which uses partial=True)."""
        return self.put(request, *args, pk=pk, **kwargs)

    def delete(self, request, *args, pk=None, **kwargs):
        self._validate_tenant_integrity()
        self.pre_mutation(request)
        is_many = isinstance(request.data, list) and pk is None

        if pk:
            # Single Delete — always sync
            obj = self.get_object(pk)
            if not obj:
                return ResponseFactory.not_found(f"{self.entity_name or 'Record'} not found")

            with transaction.atomic():
                self.pre_delete(request, obj, *args, **kwargs)
                self.perform_destroy(obj)
                self.post_delete(obj)
            return ResponseFactory.success(message="Deleted successfully")

        elif is_many:
            # Bulk Delete — always async
            context = self._build_operation_context("delete")
            from core.admin.tasks.bulk_tasks import bulk_delete_task
            task = bulk_delete_task.delay(request.data, context.to_dict())
            return ResponseFactory.accepted(
                message=f"Bulk delete queued ({len(request.data)} records)",
                data={
                    "task_id": task.id,
                    "status_url": f"/api/admin/operations/{task.id}/",
                },
            )

        return ResponseFactory.error("Invalid request for delete.")


# --------------------------
# Base Choice API
# --------------------------
# class BaseChoicesAPIView(APIView):
#     model = None
#     field_name: str | None = None
#     field_names: list[str] = []

#     def get_field_names(self):
#         if self.field_name and not self.field_names:
#             return [self.field_name]
#         return self.field_names

#     def get_choices(self, field_name):
#         if not self.model or not field_name:
#             raise NotImplementedError(
#                 "You must define 'model' and 'field_name(s)' in the subclass."
#             )
#         return get_field_choices(self.model, field_name)

#     @extend_schema(
#         summary="Get model field choices",
#         description="Returns available options for one or more declared model fields.",
#         tags=["Choices"],
#         responses={
#             200: OpenApiResponse(response={"type": "object"}),  # placeholder
#             400: OpenApiResponse(
#                 description="Error if model/field not properly configured."
#             ),
#         },
#     )
#     def get(self, request, *args, **kwargs):
#         field_names = self.get_field_names()
#         if not field_names:
#             return ResponseFactory.error(
#                 "Subclass must define 'field_name' or 'field_names'."
#             )

#         try:
#             if len(field_names) == 1:
#                 field_name = field_names[0]
#                 data = ChoicesSerializer(self.get_choices(field_name), many=True).data
#             else:
#                 data = {
#                     f"{field_name}_choices": ChoicesSerializer(
#                         self.get_choices(field_name), many=True
#                     ).data
#                     for field_name in field_names
#                 }
#         except Exception as e:
#             return ResponseFactory.server_error(
#                 "Failed to fetch choices.", {"error": str(e)}
#             )

#         return ResponseFactory.success(
#             message="Choices fetched successfully", data=data
#         )
