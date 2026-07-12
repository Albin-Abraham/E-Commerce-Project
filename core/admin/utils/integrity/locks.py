# core/admin/utils/integrity/locks.py
import time
from contextlib import contextmanager
from django.core.cache import cache
import logging

logger = logging.getLogger(__name__)

class DistributedLockError(Exception):
    """Exception raised when a distributed lock cannot be acquired."""
    pass

@contextmanager
def distributed_lock(lock_id, timeout=60, retry_delay=0.1, max_retries=10):
    """
    Context manager for a distributed lock using Redis (via Django cache).
    Ensures that a specific resource is only accessed by one process at a time.
    """
    lock_key = f"lock:{lock_id}"
    acquired = False
    
    for _ in range(max_retries):
        # NX=True ensures the key is only set if it doesn't already exist
        if cache.add(lock_key, "locked", timeout):
            acquired = True
            break
        time.sleep(retry_delay)
    
    if not acquired:
        logger.warning(f"Could not acquire lock: {lock_key}")
        raise DistributedLockError(f"Resource {lock_id} is currently locked.")
    
    try:
        yield
    finally:
        cache.delete(lock_key)
