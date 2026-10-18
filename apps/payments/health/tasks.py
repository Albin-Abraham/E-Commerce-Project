# apps/payments/health/tasks.py
"""
Celery background tasks for scheduled payment gateway health monitoring.
"""

import logging
from celery import shared_task
from apps.payments.health.service import PaymentGatewayHealthMonitorService

logger = logging.getLogger(__name__)


@shared_task(name="apps.payments.health.tasks.monitor_all_payment_gateways_health_task")
def monitor_all_payment_gateways_health_task() -> list[dict]:
    """
    Scheduled Celery Beat task: Periodically executes health, connectivity,
    and authentication probes across all payment gateways.
    """
    logger.info("Executing scheduled payment gateway health check monitoring task...")
    results = PaymentGatewayHealthMonitorService.check_all_gateways(persist=True)
    summary = [r.to_dict() for r in results]
    logger.info(f"Completed payment gateway health monitoring for {len(summary)} gateways.")
    return summary
