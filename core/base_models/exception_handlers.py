from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from core.base_models.exceptions import PlatformException
import logging

logger = logging.getLogger(__name__)

def platform_exception_handler(exc, context):
    """
    Custom exception handler that standardizes platform-specific errors 
    into a unified JSON response format.
    """
    # Call DRF's default exception handler first to get the standard error response.
    response = exception_handler(exc, context)

    # If it's a platform-specific exception, wrap it in our custom structure
    if isinstance(exc, PlatformException):
        
        # 1. Critical Domain Violations (DevOps Alerts)
        from core.base_models.exceptions import StructuralIntegrityError
        if isinstance(exc, StructuralIntegrityError):
            logger.critical(
                f"STRUCTURAL INTEGRITY VIOLATION: {exc.message}. "
                f"This means a developer bypassed the Mediator pattern!"
            )
            
        data = {
            "error": {
                "code": exc.code,
                "message": exc.message,
                "metadata": exc.metadata,
            }
        }
        return Response(data, status=exc.status_code)
    # Handle standard Django/DRF exceptions if we want to wrap them too
    if response is not None:
        response.data = {
            "error": {
                "code": "request_error",
                "message": response.data.get("detail", "One or more validation errors occurred."),
                "metadata": response.data
            }
        }
    else:
        # Fallback for unhandled server errors (500)
        logger.exception(f"Unhandled Platform Error: {exc}")
        data = {
            "error": {
                "code": "internal_server_error",
                "message": "An unhandled system error occurred.",
                "metadata": {}
            }
        }
        return Response(data, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return response
