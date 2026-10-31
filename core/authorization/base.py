# core/authorization/base.py
from abc import ABC

from core.context.object_context import ObjectContext
from core.context.request_context import RequestContext


class BasePolicy(ABC):
    """
    Abstract Authorization Policy Contract.
    Evaluates whether an action is permitted by comparing caller RequestContext
    against target ObjectContext.
    """

    def can_create(self, req: RequestContext, obj: ObjectContext) -> bool:
        return False

    def can_read(self, req: RequestContext, obj: ObjectContext) -> bool:
        return False

    def can_update(self, req: RequestContext, obj: ObjectContext) -> bool:
        return False

    def can_delete(self, req: RequestContext, obj: ObjectContext) -> bool:
        return False

    def can_perform(self, action: str, req: RequestContext, obj: ObjectContext) -> bool:
        """Dynamically delegates to action-specific handler (e.g. 'can_update', 'can_publish')."""
        handler = getattr(self, f"can_{action}", None)
        if callable(handler):
            return bool(handler(req, obj))
        return False
