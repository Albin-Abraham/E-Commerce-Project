# core/admin/utils/context.py
import contextvars
from typing import Optional, Dict, Any
from core.admin.constants import PlatformHeaders
from core.session.context import SessionContext
from contextlib import contextmanager

# Industrialized Context Variables (ASGI/Channels Ready)
_user_var = contextvars.ContextVar('user', default=None)
_ip_var = contextvars.ContextVar('ip', default=None)
_rid_var = contextvars.ContextVar('request_id', default=None)
_platform_var = contextvars.ContextVar('platform', default='web')
_version_var = contextvars.ContextVar('version', default='1.0.0')

# Multi-Tenant Scoping Variables
_company_var = contextvars.ContextVar('company_id', default=None)
_business_unit_var = contextvars.ContextVar('business_unit_id', default=None)
_branch_var = contextvars.ContextVar('branch_id', default=None)

class RequestContext:
    """
    Industrialized Context Manager.
    Adapts request-level state into isolated contextvars for use in Services/Serializers.
    """
    
    @staticmethod
    def _set_user(user): _user_var.set(user)
    @staticmethod
    def get_user(): return _user_var.get()

    @staticmethod
    def _set_ip(ip): _ip_var.set(ip)
    @staticmethod
    def get_ip(): return _ip_var.get()

    @staticmethod
    def _set_request_id(rid): _rid_var.set(rid)
    @staticmethod
    def get_request_id(): return _rid_var.get()

    @staticmethod
    def _set_platform(p): _platform_var.set(p)
    @staticmethod
    def get_platform(): return _platform_var.get()

    @staticmethod
    def _set_version(v): _version_var.set(v)
    @staticmethod
    def get_version(): return _version_var.get()

    @staticmethod
    def _set_company_id(cid): _company_var.set(cid)
    @staticmethod
    def get_company_id(): return _company_var.get()

    @staticmethod
    def _set_business_unit_id(buid): _business_unit_var.set(buid)
    @staticmethod
    def get_business_unit_id(): return _business_unit_var.get()

    @staticmethod
    def _set_branch_id(bid): _branch_var.set(bid)
    @staticmethod
    def get_branch_id(): return _branch_var.get()

    @classmethod
    def get_metadata(cls) -> Dict[str, Any]:
        """Returns a sanitized, read-only manifest of the current request context."""
        user = cls.get_user()
        return {
            "request_id": cls.get_request_id(),
            "platform": cls.get_platform(),
            "version": cls.get_version(),
            "company_id": cls.get_company_id(),
            "business_unit_id": cls.get_business_unit_id(),
            "branch_id": cls.get_branch_id(),
            "user_id": str(user.id) if user and hasattr(user, 'id') else None,
            "ip": cls.get_ip()
        }

    @staticmethod
    def clear():
        """Reset all context variables."""
        _user_var.set(None)
        _ip_var.set(None)
        _rid_var.set(None)
        _platform_var.set('web')
        _version_var.set('1.0.0')
        _company_var.set(None)
        _business_unit_var.set(None)
        _branch_var.set(None)

class ContextEngine:
    """
    Mandatory Context Engine for Background Tasks and Management Commands.
    Provides a thread-safe context manager to explicitly inject tenant scopes 
    when operating outside the HTTP Request Lifecycle.
    """
    @classmethod
    @contextmanager
    def run_as_tenant(cls, company_id=None, business_unit_id=None, branch_id=None):
        old_comp = RequestContext.get_company_id()
        old_bu = RequestContext.get_business_unit_id()
        old_branch = RequestContext.get_branch_id()
        
        RequestContext._set_company_id(company_id)
        RequestContext._set_business_unit_id(business_unit_id)
        RequestContext._set_branch_id(branch_id)
        try:
            yield
        finally:
            RequestContext._set_company_id(old_comp)
            RequestContext._set_business_unit_id(old_bu)
            RequestContext._set_branch_id(old_branch)


class RequestContextMiddleware:
    """
    Middleware to populate the RequestContext for every request.
    Adapts both Session-based and Header-based multi-tenant scoping.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # 1. Identity & Network
        RequestContext._set_user(request.user if request.user.is_authenticated else None)
        
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        ip = x_forwarded_for.split(',')[0] if x_forwarded_for else request.META.get('REMOTE_ADDR')
        RequestContext._set_ip(ip)

        # 2. Platform Context
        platform = request.headers.get(PlatformHeaders.PLATFORM, 'web').lower()
        RequestContext._set_platform(platform)
        RequestContext._set_version(request.headers.get(PlatformHeaders.PLATFORM_VERSION, '1.0.0'))

        # 3. Tenant Scoping Adaptation (Session -> Headers)
        company_id = SessionContext.get_company_id(request) or request.headers.get(PlatformHeaders.TENANT)
        business_unit_id = SessionContext.get_business_unit_id(request) or request.headers.get(PlatformHeaders.TENANT_BUSINESS_UNIT)
        branch_id = SessionContext.get_branch_id(request) or request.headers.get(PlatformHeaders.TENANT_BRANCH)
        
        RequestContext._set_company_id(company_id)
        RequestContext._set_business_unit_id(business_unit_id)
        RequestContext._set_branch_id(branch_id)

        # 4. Distributed Tracing
        request_id = request.headers.get(PlatformHeaders.REQUEST_ID) or request.META.get('HTTP_X_REQUEST_ID')
        if not request_id:
            import uuid
            request_id = str(uuid.uuid4())
        RequestContext._set_request_id(request_id)

        response = self.get_response(request)
        
        # 5. Inject Request ID into response
        response[PlatformHeaders.REQUEST_ID] = request_id
        
        # 6. Guaranteed Cleanup
        RequestContext.clear()
        
        return response
