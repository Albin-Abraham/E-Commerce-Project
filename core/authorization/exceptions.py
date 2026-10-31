# core/authorization/exceptions.py
from core.base_models.exceptions import PlatformException


class AuthorizationDeniedError(PlatformException):
    """Raised when an operation is rejected by the PolicyEngine."""

    message = "Authorization denied by policy."
    code = "authorization_denied"
    status_code = 403

    def __init__(self, message: str | None = None, metadata: dict | None = None):
        super().__init__(
            message=message or self.message,
            code=self.code,
            metadata=metadata or {},
        )
