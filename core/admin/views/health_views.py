from django.http import JsonResponse
from django.db import connections
from django.db.utils import OperationalError
from django_redis import get_redis_connection
import logging

logger = logging.getLogger(__name__)

def health_live(request):
    """
    Liveness probe: returns 200 if the web server is running.
    Bypasses DRF authentication to avoid DB lookups.
    """
    return JsonResponse({"status": "live"}, status=200)

def health_ready(request):
    """
    Readiness probe: checks if the database and redis are accessible.
    Bypasses DRF authentication.
    """
    status = {
        "database": "ok",
        "redis": "ok",
    }
    status_code = 200

    # Check Database
    try:
        # We use 'default' connection. This won't trigger session lookups.
        db_conn = connections['default']
        db_conn.cursor()
    except OperationalError:
        status["database"] = "unavailable"
        status_code = 503
    except Exception as e:
        logger.error(f"Health check DB error: {e}")
        status["database"] = "error"
        status_code = 503

    # Check Redis
    try:
        redis_conn = get_redis_connection("default")
        redis_conn.ping()
    except Exception as e:
        logger.error(f"Health check Redis error: {e}")
        status["redis"] = "unavailable"
        status_code = 503

    return JsonResponse(status, status=status_code)
