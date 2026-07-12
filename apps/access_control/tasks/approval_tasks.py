import logging
from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task
def check_approval_timeouts():
    """
    Periodic task to check and handle approval request timeouts.
    Scheduled via celery-beat: every 5 minutes.
    """
    from apps.access_control.services.approval_engine import ApprovalEngine

    logger.info("Running approval timeout check...")
    try:
        ApprovalEngine.check_timeouts()
        logger.info("Approval timeout check completed.")
    except Exception as e:
        logger.error(f"Approval timeout check failed: {e}", exc_info=True)
        raise
