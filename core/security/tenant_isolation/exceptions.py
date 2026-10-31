# core/security/tenant_isolation/exceptions.py
from core.base_models.exceptions import PlatformException


class TenantContextMissingError(PlatformException):
    """Raised when an operation requires an active tenant context but none is established."""

    message = "Active tenant context is required for this operation."
    code = "tenant_context_missing"
    status_code = 403

    def __init__(self, message: str | None = None, metadata: dict | None = None):
        super().__init__(
            message=message or self.message,
            code=self.code,
            metadata=metadata or {},
        )


class TenantAccessViolationError(PlatformException):
    """Raised when an entity belonging to a different tenant is accessed or mutated."""

    message = "Cross-tenant access is strictly prohibited."
    code = "tenant_access_violation"
    status_code = 403

    def __init__(self, message: str | None = None, metadata: dict | None = None):
        super().__init__(
            message=message or self.message,
            code=self.code,
            metadata=metadata or {},
        )
