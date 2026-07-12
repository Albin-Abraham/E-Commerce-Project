import logging

logger = logging.getLogger("platform.system_logs")

class LogMixin:
    """
    Industrialized Logging Mixin.
    Provides standardized methods for structured logging to both 
    the database (SystemLogEntry) and the system console/file.
    """

    def _log_system_event(self, level, message, module=None, payload=None):
        from core.admin.models.auditlog import SystemLogEntry
        from core.admin.utils.context import RequestContext

        module_name = module or self.__class__.__name__
        request_id = RequestContext.get_request_id()
        user = RequestContext.get_user()
        ip = RequestContext.get_ip()

        # 1. Console Logging (Structured)
        log_msg = f"[{level}] {module_name} | RID: {request_id} | {message}"
        if level == 'INFO': logger.info(log_msg)
        elif level == 'WARNING': logger.warning(log_msg)
        elif level == 'ERROR': logger.error(log_msg)
        elif level == 'CRITICAL': logger.critical(log_msg)

        # 2. Database Persistence
        try:
            SystemLogEntry.objects.create(
                level=level,
                module=module_name,
                message=message,
                payload=payload or {},
                user=user,
                ip_address=ip,
                request_id=request_id
            )
        except Exception as e:
            # Prevent logging failures from crashing the main logic
            print(f"CRITICAL FAILURE: Could not persist SystemLogEntry: {e}")

    def log_info(self, message, payload=None):
        self._log_system_event('INFO', message, payload=payload)

    def log_warning(self, message, payload=None):
        self._log_system_event('WARNING', message, payload=payload)

    def log_error(self, message, payload=None, exc=None):
        if exc:
            message = f"{message} | Exception: {str(exc)}"
        self._log_system_event('ERROR', message, payload=payload)

    def log_critical(self, message, payload=None):
        self._log_system_event('CRITICAL', message, payload=payload)
