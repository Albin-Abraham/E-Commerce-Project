# core/context/context_manager.py
import contextvars
from collections.abc import Generator
from contextlib import contextmanager

from core.context.request_context import RequestContext

_current_request_context: contextvars.ContextVar[RequestContext] = contextvars.ContextVar(
    "current_request_context",
    default=RequestContext(),
)


class RequestContextManager:
    """
    Thread-safe & Async-safe RequestContext Manager.
    Manages caller execution state using Python contextvars.
    """

    @classmethod
    def get(cls) -> RequestContext:
        """Returns the current active RequestContext (or anonymous default)."""
        return _current_request_context.get()

    @classmethod
    def set(cls, context: RequestContext) -> contextvars.Token:
        """Sets the active RequestContext and returns a reset token."""
        return _current_request_context.set(context)

    @classmethod
    def reset(cls, token: contextvars.Token) -> None:
        """Resets context using a previously acquired token."""
        _current_request_context.reset(token)

    @classmethod
    def clear(cls) -> None:
        """Resets to an anonymous RequestContext."""
        _current_request_context.set(RequestContext())

    @classmethod
    @contextmanager
    def scope(cls, context: RequestContext) -> Generator[RequestContext, None, None]:
        """Scoped context manager that guarantees cleanup in finally block."""
        token = cls.set(context)
        try:
            yield context
        finally:
            cls.reset(token)
