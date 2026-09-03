import logging
from celery import shared_task
from django.contrib.auth import get_user_model
from apps.customers.models.customer import Customer, SocialAccount
from core.services.gcp_storage_service import GCPStorageService

User = get_user_model()
logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def dispatch_welcome_customer_email_task(self, customer_id: str):
    """
    Celery Background Task: Dispatches welcome onboarding email & SMS to newly registered customer using AutoResponder Engine.
    """
    try:
        customer = Customer.objects.filter(id=customer_id).first()
        if not customer:
            return {"status": "customer_not_found"}

        from apps.autoresponder.tasks import trigger_autoresponder_event_task
        context = {
            "customer_name": customer.name,
            "customer_code": customer.customer_code,
            "email": customer.email,
        }
        trigger_autoresponder_event_task.delay("CUSTOMER_WELCOME", customer.email, context)

        logger.info(f"[Celery Customer Worker] Dispatched AutoResponder welcome event for customer '{customer.name}'")
        return {"status": "event_queued", "email": customer.email, "customer_code": customer.customer_code}
    except Exception as exc:
        logger.error(f"[Celery Customer Worker] Failed to send welcome email: {exc}")
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=3)
def sync_customer_avatar_to_google_bucket_task(self, user_id: str, source_avatar_url: str):
    """
    Celery Background Task: Downloads social avatar image asynchronously and mirrors it to Google Cloud Storage Bucket.
    """
    try:
        gcs_avatar_url = GCPStorageService.upload_social_avatar_to_bucket(source_avatar_url, user_id)
        social_acc = SocialAccount.objects.filter(user_id=user_id).first()
        if social_acc and gcs_avatar_url:
            social_acc.avatar_url = gcs_avatar_url
            social_acc.save(update_fields=["avatar_url", "updated_at"])
            logger.info(f"[Celery Worker] Mirrored avatar for user {user_id} to GCS Bucket: {gcs_avatar_url}")
            return {"status": "avatar_uploaded", "gcs_url": gcs_avatar_url}

    except Exception as exc:
        logger.error(f"[Celery Worker] Avatar upload task failed: {exc}")
        raise self.retry(exc=exc)
