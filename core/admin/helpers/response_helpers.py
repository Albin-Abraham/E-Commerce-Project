from typing import Any

from rest_framework import status
from rest_framework.response import Response


class ResponseFactory:
    """Factory class for standardized API responses with dynamic message formatting & context support."""

    @staticmethod
    def format_message(message: str, context: dict | None = None) -> str:
        """
        Dynamically formats a template message using the context dictionary.
        Gracefully returns unformatted message on syntax mismatch.
        """
        if not context:
            return message
        try:
            return message.format(**context)
        except (KeyError, ValueError, IndexError):
            return message

    # -----------------------
    # Success Responses
    # -----------------------
    @staticmethod
    def success(
        data: Any = None,
        message: str = "Request successful",
        status_code: int = status.HTTP_200_OK,
        meta: dict | None = None,
        context: dict | None = None,
    ) -> Response:
        formatted_msg = ResponseFactory.format_message(message, context)
        payload = {"success": True, "message": formatted_msg, "data": data}
        metadata = meta or context
        if metadata:
            payload["meta"] = metadata
        return Response(payload, status=status_code)

    @staticmethod
    def created(
        data: Any = None, 
        message: str = "Resource created successfully",
        meta: dict | None = None,
        context: dict | None = None,
    ) -> Response:
        return ResponseFactory.success(
            data=data, message=message, status_code=status.HTTP_201_CREATED, meta=meta, context=context
        )

    @staticmethod
    def accepted(
        data: Any = None, message: str = "Request accepted for processing", context: dict | None = None
    ) -> Response:
        return ResponseFactory.success(
            data=data, message=message, status_code=status.HTTP_202_ACCEPTED, context=context
        )

    @staticmethod
    def no_content(message: str = "No content") -> Response:
        return ResponseFactory.success(
            message=message, data=None, status_code=status.HTTP_204_NO_CONTENT
        )

    # -----------------------
    # Error Responses
    # -----------------------
    @staticmethod
    def error(
        message: str = "Bad request",
        details: dict | None = None,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        context: dict | None = None,
    ) -> Response:
        formatted_msg = ResponseFactory.format_message(message, context)
        payload = {"success": False, "message": formatted_msg}
        if details:
            payload["details"] = details
        elif context:
            payload["details"] = context
        return Response(payload, status=status_code)

    @staticmethod
    def validation_error(errors: dict, message: str = "Validation failed") -> Response:
        return ResponseFactory.error(
            message=message,
            details={"errors": errors},
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        )

    @staticmethod
    def unauthorized(message: str = "Unauthorized") -> Response:
        return ResponseFactory.error(
            message=message, status_code=status.HTTP_401_UNAUTHORIZED
        )

    @staticmethod
    def forbidden(message: str = "Forbidden") -> Response:
        return ResponseFactory.error(
            message=message, status_code=status.HTTP_403_FORBIDDEN
        )

    @staticmethod
    def not_found(message: str = "Resource not found") -> Response:
        return ResponseFactory.error(
            message=message, status_code=status.HTTP_404_NOT_FOUND
        )

    @staticmethod
    def method_not_allowed(message: str = "Method not allowed") -> Response:
        return ResponseFactory.error(
            message=message, status_code=status.HTTP_405_METHOD_NOT_ALLOWED
        )

    @staticmethod
    def conflict(message: str = "Conflict detected") -> Response:
        return ResponseFactory.error(
            message=message, status_code=status.HTTP_409_CONFLICT
        )

    @staticmethod
    def unsupported_media_type(message: str = "Unsupported media type") -> Response:
        return ResponseFactory.error(
            message=message, status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE
        )

    @staticmethod
    def gone(message: str = "Resource no longer available") -> Response:
        return ResponseFactory.error(message=message, status_code=status.HTTP_410_GONE)

    @staticmethod
    def precondition_failed(message: str = "Precondition failed") -> Response:
        return ResponseFactory.error(
            message=message, status_code=status.HTTP_412_PRECONDITION_FAILED
        )

    @staticmethod
    def server_error(
        message: str = "Internal server error", details: dict | None = None
    ) -> Response:
        return ResponseFactory.error(
            message=message,
            details=details,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )