import logging
from celery import shared_task
from apps.autoresponder.services.autoresponder_service import AutoResponderEngine

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=5)
def trigger_autoresponder_event_task(self, event_key: str, recipient_email: str, context: dict):
    """
    Celery Background Task: Asynchronously processes and dispatches AutoResponder template emails & notifications.
    """
    logger.info(f"[Celery AutoResponder Worker] Processing event '{event_key}' for {recipient_email}")
    try:
        log = AutoResponderEngine.dispatch_event(
            event_key=event_key,
            recipient_email=recipient_email,
            context=context,
        )
        return {"status": log.status, "log_id": str(log.id), "recipient": recipient_email}
    except Exception as exc:
        logger.error(f"[Celery AutoResponder Worker] Error processing event '{event_key}': {exc}")
        raise self.retry(exc=exc)
