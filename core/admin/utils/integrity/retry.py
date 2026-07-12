# core/admin/utils/integrity/retry.py
import time
import logging
from django.core.exceptions import ValidationError
from django.db import transaction

logger = logging.getLogger(__name__)

def retry_on_conflict(max_retries=3, delay=0.1):
    """
    Decorator to retry a service method if an Optimistic Locking 
    conflict (ValidationError) is detected.
    """
    def decorator(func):
        def wrapper(*args, **kwargs):
            last_exception = None
            for attempt in range(max_retries):
                try:
                    # Each attempt MUST be in its own atomic block if inside a transaction
                    # but here we assume the service method handles its own transaction or 
                    # we wrap the whole thing.
                    return func(*args, **kwargs)
                except ValidationError as e:
                    # Check if it's a conflict error from our BaseModel
                    if "Conflict detected" in str(e):
                        last_exception = e
                        logger.warning(f"Conflict detected in {func.__name__} (Attempt {attempt + 1}/{max_retries}). Retrying...")
                        time.sleep(delay * (2 ** attempt)) # Exponential backoff
                        continue
                    raise e
            logger.error(f"Max retries reached for {func.__name__} due to conflict.")
            raise last_exception
        return wrapper
    return decorator
