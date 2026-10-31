# apps/shop/policies/vendor_product_policy.py
from core.authorization.base import BasePolicy
from core.context.object_context import ObjectContext
from core.context.request_context import RequestContext


class VendorProductPolicy(BasePolicy):
    """
    Vendor Product Authorization Policy.
    Enforces that vendors can only mutate and inspect products they own
    via their assigned Supplier / Company ID.
    """

    def can_read(self, req: RequestContext, obj: ObjectContext) -> bool:
        # Public catalog items can be read by anyone
        if obj.is_public:
            return True
        # Staff can inspect any product
        if req.is_staff:
            return True
        # Vendor can inspect their own products
        if req.is_vendor and req.supplier_id and req.supplier_id == obj.supplier_id:
            return True
        if req.is_vendor and req.company_id and req.company_id == obj.company_id:
            return True
        return False

    def can_update(self, req: RequestContext, obj: ObjectContext) -> bool:
        if req.is_staff:
            return True
        if req.is_vendor:
            if req.supplier_id and req.supplier_id == obj.supplier_id:
                return True
            if req.company_id and req.company_id == obj.company_id:
                return True
        return False

    def can_delete(self, req: RequestContext, obj: ObjectContext) -> bool:
        return self.can_update(req, obj)

    def can_create(self, req: RequestContext, obj: ObjectContext) -> bool:
        return req.is_vendor or req.is_staff
