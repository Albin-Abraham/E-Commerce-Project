import logging
import re
from django.core.mail import send_mail
from django.core.mail.backends.smtp import EmailBackend
from core.base_models.system_models import SystemConfig

logger = logging.getLogger(__name__)


class DynamicSMTPEmailService:
    """
    SMTP Email Service that dynamically loads SMTP server configuration
    (EMAIL_HOST, EMAIL_PORT, EMAIL_HOST_USER, EMAIL_HOST_PASSWORD, EMAIL_USE_TLS, DEFAULT_FROM_EMAIL)
    strictly from the SystemConfig database registry.
    Integrated with AutoResponder event templates and dynamic context placeholder rendering (e.g. {{user}}, {{order_number}}).
    """

    @classmethod
    def get_smtp_connection(cls):
        """
        Builds a Django SMTP EmailBackend instance dynamically using SystemConfig entries.
        """
        host = SystemConfig.load_val("EMAIL_HOST", "smtp.gmail.com")
        port = int(SystemConfig.load_val("EMAIL_PORT", "587"))
        username = SystemConfig.load_val("EMAIL_HOST_USER")
        password = SystemConfig.load_val("EMAIL_HOST_PASSWORD")
        use_tls = SystemConfig.load_val("EMAIL_USE_TLS", "true").strip().lower() in ("true", "1", "yes")

        if not username or not password:
            logger.warning("EMAIL_HOST_USER or EMAIL_HOST_PASSWORD is missing in SystemConfig. Using default Django backend.")
            return None

        return EmailBackend(
            host=host,
            port=port,
            username=username,
            password=password,
            use_tls=use_tls,
            fail_silently=False,
        )

    @classmethod
    def send_email(cls, subject: str, body: str, recipient_email: str, html_body: str | None = None) -> bool:
        """
        Dispatches an email to recipient using SystemConfig SMTP credentials.
        """
        from_email = SystemConfig.load_val("DEFAULT_FROM_EMAIL", "No-Reply <noreply@yafeiplatform.com>")
        connection = cls.get_smtp_connection()

        try:
            send_mail(
                subject=subject,
                message=body,
                from_email=from_email,
                recipient_list=[recipient_email],
                html_message=html_body,
                connection=connection,
                fail_silently=False,
            )
            logger.info(f"Successfully sent email '{subject}' to {recipient_email} via SystemConfig SMTP credentials")
            return True
        except Exception as exc:
            logger.error(f"Failed to send email to {recipient_email} via SystemConfig SMTP: {exc}")
            return False

    @classmethod
    def send_templated_autoresponder_email(cls, event_key: str, recipient_email: str, context: dict) -> bool:
        """
        Fetches the AutoResponderEvent template for event_key, renders context placeholders
        ({{user}}, {{customer_name}}, {{order_number}}, {{amount}}, {{tracking_code}}),
        and dispatches the email via SystemConfig SMTP.
        """
        from apps.autoresponder.models import AutoResponderEvent, NotificationLog

        event = AutoResponderEvent.objects.filter(key=event_key, is_active=True).first()

        # Build context placeholders map (handling {{user}} object or string)
        context_map = {}
        for k, v in context.items():
            if k in ("user", "customer") and hasattr(v, "username"):
                context_map["user"] = getattr(v, "username", str(v))
                context_map["user_email"] = getattr(v, "email", str(v))
            else:
                context_map[k] = str(v)

        if event:
            subject = event.render_subject(context_map)
            body = event.render_content(context_map)
        else:
            # Fallback template rendering if event is not yet seeded
            user_val = context_map.get("user", context_map.get("customer_name", recipient_email))
            subject = f"Notification: {event_key.replace('_', ' ').title()}"
            body = f"Hello {user_val},\n\nThis is an automated notification regarding your account.\n\nDetails:\n"
            for k, v in context_map.items():
                body += f"- {k.replace('_', ' ').title()}: {v}\n"
            body += "\nThank you for choosing Yafei Platform."

        # Audit Log Entry
        log = NotificationLog.objects.create(
            event_key=event_key,
            recipient_email=recipient_email,
            medium_used="EXTERNAL_EMAIL",
            rendered_subject=subject,
            rendered_content=body,
            status="DISPATCHED",
        )

        success = cls.send_email(subject=subject, body=body, recipient_email=recipient_email)
        log.status = "DELIVERED" if success else "FAILED"
        log.save(update_fields=["status", "updated_at"])

        return success
