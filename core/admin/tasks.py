from celery import shared_task
import time
import logging

logger = logging.getLogger(__name__)

@shared_task
def sample_background_task(seconds=5):
    """
    A sample background task that sleeps for a specified duration.
    """
    logger.info(f"Starting sample background task for {seconds} seconds...")
    time.sleep(seconds)
    logger.info("Sample background task completed successfully.")
    return f"Completed after {seconds} seconds"

@shared_task
def scheduled_heartbeat():
    """
    A sample task intended to be run periodically by Celery Beat.
    """
    logger.info("Celery Beat Heartbeat: Service is healthy.")
    return "Heartbeat recorded"
