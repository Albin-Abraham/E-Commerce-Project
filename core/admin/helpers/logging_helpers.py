# from django.db.models import Model
# from sfm_log.utils import log_audit_trail

# from .display_helpers import get_display_name


# def log_action(
#     request,
#     action: str,
#     instance: Model,
#     entity_name=None,
#     display_field=None,
#     display_format=None,
#     logger=None,
# ):
#     log_audit_trail(
#         request=request,
#         audit_trail_message=f"User {request.user.username} {action} {entity_name or instance.__class__.__name__.lower()} '{get_display_name(instance, display_field, display_format, logger)}'",
#     )


# def log_failure(request, action: str, message: str, entity_name=None):
#     log_audit_trail(
#         request=request,
#         audit_trail_message=f"Failed to {action} {entity_name or 'record'}: {message}",
#     )