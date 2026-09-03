import logging
from celery import shared_task
from django.utils import timezone
from apps.payments.models import PaymentTransaction
from apps.payments.services.payment_service import RazorpayPaymentGateway, PayPalPaymentGateway

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=5)
def process_async_razorpay_webhook_task(self, event_name: str, razorpay_order_id: str, razorpay_payment_id: str, razorpay_signature: str):
    """
    Celery Background Task: Asynchronously processes Razorpay Webhooks (IPNs) via Redis queue.
    """
    logger.info(f"[Celery Payment Worker] Processing Razorpay event '{event_name}' for Order {razorpay_order_id}")
    try:
        tx = PaymentTransaction.objects.filter(gateway_order_id=razorpay_order_id).first()
        if not tx:
            logger.warning(f"[Celery Payment Worker] Transaction for Razorpay order {razorpay_order_id} not found.")
            return {"status": "not_found"}

        if event_name in ("payment.captured", "order.paid"):
            tx.gateway_payment_id = razorpay_payment_id
            tx.gateway_signature = razorpay_signature
            tx.status = "CAPTURED"
            tx.save(update_fields=["gateway_payment_id", "gateway_signature", "status", "updated_at"])

            if tx.order:
                tx.order.status = "confirmed"
                tx.order.save(update_fields=["status"])

            logger.info(f"[Celery Payment Worker] Successfully captured transaction {tx.transaction_code}")
            return {"status": "captured", "transaction_code": tx.transaction_code}

        elif event_name == "payment.failed":
            tx.status = "FAILED"
            tx.failure_reason = "Razorpay Webhook: Payment Failed"
            tx.save(update_fields=["status", "failure_reason", "updated_at"])
            return {"status": "failed", "transaction_code": tx.transaction_code}

    except Exception as exc:
        logger.error(f"[Celery Payment Worker] Error processing Razorpay webhook: {exc}")
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=3, default_retry_delay=5)
def process_async_paypal_webhook_task(self, event_type: str, paypal_order_id: str, resource_payload: dict):
    """
    Celery Background Task: Asynchronously processes PayPal Webhook IPNs via Redis queue.
    """
    logger.info(f"[Celery Payment Worker] Processing PayPal event '{event_type}' for Order {paypal_order_id}")
    try:
        tx = PaymentTransaction.objects.filter(gateway_order_id=paypal_order_id).first()
        if not tx:
            logger.warning(f"[Celery Payment Worker] Transaction for PayPal order {paypal_order_id} not found.")
            return {"status": "not_found"}

        if event_type in ("PAYMENT.CAPTURE.COMPLETED", "CHECKOUT.ORDER.APPROVED"):
            tx.status = "CAPTURED"
            tx.gateway_response = resource_payload
            tx.save(update_fields=["status", "gateway_response", "updated_at"])

            if tx.order:
                tx.order.status = "confirmed"
                tx.order.save(update_fields=["status"])

            return {"status": "captured", "transaction_code": tx.transaction_code}

    except Exception as exc:
        logger.error(f"[Celery Payment Worker] Error processing PayPal webhook: {exc}")
        raise self.retry(exc=exc)


@shared_task
def reconcile_pending_transactions_task():
    """
    Celery Beat Periodic Task: Reconciles stale PENDING payment transactions.
    Dispatches status updates every 15 minutes.
    """
    stale_cutoff = timezone.now() - timezone.timedelta(minutes=30)
    pending_txs = PaymentTransaction.objects.filter(status="PENDING", created_at__lt=stale_cutoff)
    reconciled_count = 0

    for tx in pending_txs:
        # Auto expire abandoned payment sessions after 2 hours
        if tx.created_at < timezone.now() - timezone.timedelta(hours=2):
            tx.status = "CANCELLED"
            tx.failure_reason = "Transaction Expired (Celery Beat Auto-Reconciliation)"
            tx.save(update_fields=["status", "failure_reason", "updated_at"])
            reconciled_count += 1

    logger.info(f"[Celery Beat] Reconciled {reconciled_count} stale payment transactions.")
    return {"reconciled_count": reconciled_count}
