# apps/customers/policies/customer_cart_policy.py
from core.authorization.base import BasePolicy
from core.context.object_context import ObjectContext
from core.context.request_context import RequestContext


class CustomerCartPolicy(BasePolicy):
    """
    Customer Cart Authorization Policy.
    Guarantees shoppers can only inspect and mutate their own cart.
    Bypasses all B2B tenant / company context.
    """

    def can_read(self, req: RequestContext, obj: ObjectContext) -> bool:
        if req.is_staff:
            return True
        if req.is_customer:
            if req.customer_id and req.customer_id == obj.customer_id:
                return True
            if req.user_id and req.user_id == obj.owner_id:
                return True
        return False

    def can_update(self, req: RequestContext, obj: ObjectContext) -> bool:
        return self.can_read(req, obj)

    def can_delete(self, req: RequestContext, obj: ObjectContext) -> bool:
        return self.can_read(req, obj)

    def can_create(self, req: RequestContext, obj: ObjectContext) -> bool:
        return req.is_customer or req.is_staff
