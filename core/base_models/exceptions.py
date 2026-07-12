class PlatformException(Exception):
    """Base class for all platform-level exceptions."""
    message = "An unexpected error occurred in the platform."
    code = "platform_error"
    status_code = 500

    def __init__(self, message=None, code=None, metadata=None):
        self.message = message or self.message
        self.code = code or self.code
        self.metadata = metadata or {}
        super().__init__(self.message)

class SystemException(PlatformException):
    """Exceptions related to infrastructure, registry, or configuration."""
    message = "A system-level infrastructure error occurred."
    code = "system_failure"
    status_code = 500

class DomainException(PlatformException):
    """Exceptions related to business rules and structural integrity."""
    message = "A domain-level validation or integrity error occurred."
    code = "domain_error"
    status_code = 400

class StructuralIntegrityError(DomainException):
    """Raised when a model is saved without passing the ValidationMediator."""
    message = (
        "Direct save() blocked to ensure data integrity. "
        "HOW TO FIX: Use the 'ValidationMediator' in your view/serializer, "
        "or if running a script, set 'obj._validated_by_mediator = True' "
        "after manually verifying the data."
    )
    code = "integrity_violation"
    status_code = 500

class DatabaseConflictError(PlatformException):
    """Exceptions related to concurrency or database-level conflicts (e.g. Optimistic Locking)."""
    message = "A database conflict occurred during the operation."
    code = "database_conflict"
    status_code = 409

class OptimisticLockError(DatabaseConflictError):
    """Raised when a version mismatch is detected during a save operation."""
    message = "The record has been modified by another process. Please refresh and try again."
    code = "optimistic_lock_failure"
    status_code = 409


class RuleViolation(DomainException):
    """
    Raised when a BaseRule validation fails.
    Framework-agnostic replacement for Django's ValidationError.
    """
    def __init__(self, message, code=None, field_name=None, metadata=None):
        super().__init__(message, code, metadata)
        self.field_name = field_name
