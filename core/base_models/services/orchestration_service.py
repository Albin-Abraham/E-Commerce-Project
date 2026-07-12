import logging
import time
from django.db import connections
from django.core.cache import cache
from django.utils import timezone
from celery import current_app
from core.base_models.system_models import SystemHealth, SystemConfig

logger = logging.getLogger(__name__)

class OrchestrationService:
    """
    Handles application bootstrap and real-time health monitoring (AppDispatcher logic).
    """

    @classmethod
    def bootstrap(cls):
        """
        Logic to run on application startup (e.g. from AppConfig.ready()).
        Ensures initial health records exist and checks critical connectivity.
        Runs 'Silently' (log only) to avoid RuntimeWarnings during boot.
        """
        logger.info("Starting System Bootstrap (Verify Connectivity)...")
        cls.health_check(persist=False)
        logger.info("System Bootstrap Complete.")

    @classmethod
    def health_check(cls, persist=True):
        """
        Orchestrates connectivity checks for all system dependencies.
        Skip during tests to avoid RuntimeWarnings.
        :param persist: If True, writes results to the SystemHealth database table.
        """
        from django.conf import settings
        if getattr(settings, 'TESTING', False):
            return

        cls._check_database(persist=persist)
        cls._check_redis(persist=persist)
        cls._check_celery(persist=persist)

    @classmethod
    def _check_database(cls, persist=True):
        start = time.time()
        try:
            connections['default'].cursor()
            latency = (time.time() - start) * 1000
            cls._update_health("PostgreSQL", "healthy", latency, persist=persist)
        except Exception as e:
            cls._update_health("PostgreSQL", "critical", details={"error": str(e)}, persist=persist)

    @classmethod
    def _check_redis(cls, persist=True):
        start = time.time()
        try:
            # Using django-redis cache ping if available, or raw redis
            cache.set("__health_check__", 1, timeout=5)
            latency = (time.time() - start) * 1000
            cls._update_health("Redis", "healthy", latency, persist=persist)
        except Exception as e:
            cls._update_health("Redis", "critical", details={"error": str(e)}, persist=persist)

    @classmethod
    def _check_celery(cls, persist=True):
        start = time.time()
        try:
            # Check if any workers are online
            inspect = current_app.control.inspect()
            stats = inspect.stats()
            latency = (time.time() - start) * 1000
            
            if stats:
                cls._update_health("Celery", "healthy", latency, details={"workers": list(stats.keys())}, persist=persist)
            else:
                cls._update_health("Celery", "degraded", latency, details={"error": "No active workers found."}, persist=persist)
        except Exception as e:
            cls._update_health("Celery", "critical", details={"error": str(e)}, persist=persist)

    @classmethod
    def _update_health(cls, component, status, latency=None, details=None, persist=True):
        """
        Updates or creates a SystemHealth record.
        """
        logger.debug(f"Health check for {component}: {status} ({latency:.2f}ms)")
        
        if not persist:
            logger.info(f"Bootstrap verified {component} connectivity: {status}")
            return

        try:
            SystemHealth.objects.update_or_create(
                component_name=component,
                defaults={
                    "status": status,
                    "latency_ms": latency,
                    "details": details or {},
                }
            )
        except Exception as e:
            logger.error(f"Failed to update health record for {component}: {e}")
