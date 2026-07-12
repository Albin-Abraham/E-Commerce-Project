from rest_framework import permissions
from typing import Any, Optional
from core.admin.utils.auth_utils import evaluate_policy

class CustomPermissionClass(permissions.BasePermission):
    """
    DRF Orchestrator for Permission Lookups.

    Calls ``get_required_permission_for_action()`` on the Model associated
    with the View and evaluates the returned key against the user's manifest.
    Returns *False* when the model has no permission mapping for the action.
    """

    def has_permission(self, request: Any, view: Any) -> bool:
        # 1. Resolve the Model (The Resource)
        model = self._get_model_from_view(view)
        if not model:
            # If no model is associated, we fall back to standard DRF checks 
            # or deny if strict orchestration is required.
            return False

        # 2. Resolve the Action
        action = getattr(view, 'action', None)
        if not action:
            # For non-ViewSet views, map HTTP methods to actions
            method_map = {
                'GET': 'list' if not hasattr(view, 'kwargs') or 'pk' not in view.kwargs else 'retrieve',
                'POST': 'create',
                'PUT': 'update',
                'PATCH': 'partial_update',
                'DELETE': 'destroy'
            }
            action = method_map.get(request.method, 'view')

        # 3. Get the Required Permission String from the Model Policy
        if not hasattr(model, 'get_required_permission_for_action'):
            return False

        required_perm = model.get_required_permission_for_action(action)
        if required_perm is None:
            return False

        # 4. Final Evaluation via Policy Engine
        return evaluate_policy(request.user, required_perm)

    def _get_model_from_view(self, view: Any) -> Optional[Any]:
        """
        Heuristic to find the Model associated with a view.
        """
        # 1. Explicit 'model' attribute (BaseApiView pattern)
        if hasattr(view, 'model') and view.model:
            return view.model
            
        # 2. Queryset introspection (Standard ViewSet pattern)
        if hasattr(view, 'queryset') and view.queryset is not None:
            return view.queryset.model
            
        # 3. get_queryset() call (Dynamic ViewSet pattern)
        if hasattr(view, 'get_queryset'):
            try:
                return view.get_queryset().model
            except Exception:
                pass

        return None
