from core.services.email_service import DynamicSMTPEmailService
from core.services.firebase_service import FirebaseNotificationService
from apps.autoresponder.models import AutoResponderEvent, NotificationLog, UserDeviceToken

logger = logging.getLogger(__name__)


class AutoResponderEngine:
    """
    Automated Email & Multi-Channel Notification Dispatch Service.
    Ported from yafei-hospital yf_autoresponder.
    Dispatches emails via SystemConfig-backed DynamicSMTPEmailService
    and FCM push notifications via FirebaseNotificationService.
    """

    @classmethod
    def dispatch_event(cls, event_key: str, recipient_email: str, context: dict, user_id: str | None = None) -> NotificationLog:
        """
        Dispatches autoresponder event email & notifications using templates and context variables.
        """
        event = AutoResponderEvent.objects.filter(key=event_key, is_active=True).first()
        if not event:
            logger.warning(f"AutoResponder Event '{event_key}' not found or inactive. Sending default email fallback.")
            rendered_subject = f"Notification: {event_key.replace('_', ' ').title()}"
            rendered_content = f"Hello,\n\nDetails: {context}"
            short_content = rendered_subject
            medium_list = ["EXTERNAL_EMAIL"]
        else:
            rendered_subject = event.render_subject(context)
            rendered_content = event.render_content(context)
            short_content = event.short_content or rendered_subject
            medium_list = event.medium or ["EXTERNAL_EMAIL"]

        log = NotificationLog.objects.create(
            event_key=event_key,
            recipient_email=recipient_email,
            medium_used=",".join(medium_list),
            rendered_subject=rendered_subject,
            rendered_content=rendered_content,
            status="DISPATCHED",
        )

        try:
            # 1. Email Dispatch Channel
            if "EXTERNAL_EMAIL" in medium_list or "INTERNAL_EMAIL" in medium_list:
                success = DynamicSMTPEmailService.send_email(
                    subject=rendered_subject,
                    body=rendered_content,
                    recipient_email=recipient_email,
                )
                log.status = "DELIVERED" if success else "FAILED"

            # 2. Firebase FCM Push Notification Channel
            if "PUSH_NOTIFICATION" in medium_list and user_id:
                tokens = list(UserDeviceToken.objects.filter(user_id=user_id, is_active=True).values_list("device_token", flat=True))
                if tokens:
                    fcm_res = FirebaseNotificationService.send_push_to_tokens(
                        tokens=tokens,
                        title=rendered_subject,
                        body=short_content,
                        data_payload={"event_key": event_key},
                    )
                    logger.info(f"FCM Push result for user {user_id}: {fcm_res}")

            log.save(update_fields=["status", "updated_at"])
            logger.info(f"AutoResponder event '{event_key}' dispatch status to {recipient_email}: {log.status}")

        except Exception as exc:
            log.status = "FAILED"
            log.error_message = str(exc)
            log.save(update_fields=["status", "error_message", "updated_at"])
            logger.error(f"Failed to dispatch AutoResponder event '{event_key}': {exc}")

        return log
