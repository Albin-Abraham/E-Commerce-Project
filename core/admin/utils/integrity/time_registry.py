# core/admin/utils/integrity/time_registry.py
from django.utils import timezone
from django.conf import settings
import datetime

class TimeRegistry:
    """
    Centralized utility for timezone-aware time management.
    Ensures that 'LocalDate' (local now) is retrieved consistently 
    across tasks, models, and redis interactions.
    """

    @staticmethod
    def get_local_now() -> datetime.datetime:
        """
        Returns the current datetime converted to the system's local timezone
        as defined in settings.TIME_ZONE.
        """
        return timezone.localtime(timezone.now())

    @staticmethod
    def get_local_date() -> datetime.date:
        """
        Returns the current date in the system's local timezone.
        """
        return TimeRegistry.get_local_now().date()

    @staticmethod
    def to_local(dt: datetime.datetime) -> datetime.datetime:
        """
        Converts any aware datetime to the system's local timezone.
        """
        if timezone.is_naive(dt):
            # If naive, assume it was meant to be UTC and make it aware before conversion
            dt = timezone.make_aware(dt, timezone.utc)
        return timezone.localtime(dt)
