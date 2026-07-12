from rest_framework.throttling import SimpleRateThrottle
from django.core.cache import cache
import logging

logger = logging.getLogger(__name__)

class TenantDynamicThrottle(SimpleRateThrottle):
    """
    Industrialized Throttling: Multi-tenant aware and Redis-backed.
    Fetches rate limits dynamically from the Company/Subscription metadata stored in Redis.
    """
    scope = 'tenant'

    def get_cache_key(self, request, view):
        if not request.user.is_authenticated:
            return None  # Fallback to default DRF throttling for anon
        
        # Identify tenant from industrialized session context
        from core.session.context import SessionContext
        company_id = SessionContext.get_company_id(request)
        
        if not company_id:
            profile = getattr(request.user, "profile", None)
            company_id = profile.company_id if profile else "anon"
            
        return self.cache_format % {
            'scope': self.scope,
            'ident': f"{company_id}:{request.user.id}"
        }

    def get_rate(self, request=None):
        """
        Dynamically determine the rate for the current tenant.
        If no request is provided (initialization), return a safe default.
        """
        from django.conf import settings
        default_rate = getattr(settings, "THROTTLE_RATE_DEFAULT", "1000/day")
        
        if request is None:
            return default_rate

        from core.session.context import SessionContext
        company_id = SessionContext.get_company_id(request)
        # Fetch from Redis metadata cache
        limit = cache.get(f"throttle_limit:{company_id}", default_rate)
        return limit

    def allow_request(self, request, view):
        self.rate = self.get_rate(request)
        self.num_requests, self.duration = self.parse_rate(self.rate)
        return super().allow_request(request, view)
