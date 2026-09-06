from rest_framework import permissions
from typing import Any, Optional
from core.admin.utils.auth_utils import evaluate_policy


class CustomPermissionClass(permissions.BasePermission):
    """
    DRF Orchestrator for Permission Lookups.

    Calls ``get_required_permission_for_action()`` on the Model associated
    with the View and evaluates the returned key against the user's manifest.

    Behavior:
    - If model has no permission_prefix/permission_map → allow (no restriction defined)
    - If model has permissions but action not in map → allow (action not restricted)
    - If model has permissions and action is mapped → enforce via policy engine
    """

    def has_permission(self, request: Any, view: Any) -> bool:
        # 1. Resolve the Model (The Resource)
        model = self._get_model_from_view(view)
        if not model:
            # No model to scope against → no resource-level restriction;
            # authentication is enforced by DRF's global IsAuthenticated default.
            return True

        # 2. Check if model has any permission policy defined
        has_permission_prefix = getattr(model, "permission_prefix", None)
        has_permission_map = getattr(model, "permission_map", {})

        # If model has no permission policy at all → allow
        if not has_permission_prefix and not has_permission_map:
            return True

        # 3. Resolve the Action
        action = getattr(view, "action", None)
        if not action:
            # For non-ViewSet views, map HTTP methods to actions
            method_map = {
                "GET": "list" if not hasattr(view, "kwargs") or "pk" not in view.kwargs else "retrieve",
                "POST": "create",
                "PUT": "update",
                "PATCH": "partial_update",
                "DELETE": "destroy",
            }
            action = method_map.get(request.method, "view")

        # 4. Get the Required Permission String from the Model Policy
        if not hasattr(model, "get_required_permission_for_action"):
            return True

        required_perm = model.get_required_permission_for_action(action)

        # If action not in permission_map → allow (action not restricted)
        if required_perm is None:
            return True

        # 5. Final Evaluation via Policy Engine
        return evaluate_policy(request.user, required_perm)

    def _get_model_from_view(self, view: Any) -> Optional[Any]:
        """
        Heuristic to find the Model associated with a view.
        """
        # 1. Explicit 'model' attribute (BaseApiView pattern)
        if hasattr(view, "model") and view.model:
            return view.model

        # 2. Queryset introspection (Standard ViewSet pattern)
        if hasattr(view, "queryset") and view.queryset is not None:
            return view.queryset.model

        # 3. get_queryset() call (Dynamic ViewSet pattern)
        if hasattr(view, "get_queryset"):
            try:
                return view.get_queryset().model
            except Exception:
                pass

        return None
