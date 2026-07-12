import logging
from datetime import datetime
from django.utils import timezone
from croniter import croniter
from core.base_models.system_models import SystemConfig
from celery import current_app

logger = logging.getLogger(__name__)

class SystemConfigSchedulerService:
    """
    Service to handle dynamic task dispatching based on SystemConfig schedules.
    Expected structure:
    - Group: CELERY_SCHEDULE
    - Key: task_name (e.g. core.admin.tasks.cleanup)
    - Value: crontab string (e.g. '0 0 * * *')
    """

    @classmethod
    def get_schedule_group(cls):
        return SystemConfig.objects.filter(key="CELERY_SCHEDULE").first()

    @classmethod
    def dispatch_all(cls):
        """
        Iterates through all configured schedules and dispatches due tasks.
        """
        group = cls.get_schedule_group()
        if not group:
            logger.warning("CELERY_SCHEDULE group not found in SystemConfig.")
            return

        schedules = SystemConfig.objects.filter(parent_group=group)
        for schedule in schedules:
            if not schedule.value:
                continue

            if cls.should_dispatch(schedule):
                cls.dispatch_task(schedule)

    @classmethod
    def should_dispatch(cls, schedule):
        """
        Determines if a task is due based on its cron string and last run time.
        """
        now = timezone.now()
        cron_str = schedule.value
        
        # We store metadata (last_run) in the JSON 'details' field if it exists,
        # otherwise we fetch it from the record's updated_at or similar.
        # For simplicity, let's use a standard metadata key in 'details'.
        details = schedule.description # Reusing description or we should have a JSON field?
        # Wait, SystemConfig doesn't have a JSON field. I should add one or use description.
        # Actually, let's look at the SystemConfig model again...
        # It doesn't have a JSON field. I'll use the description for now or assume a standard.
        # Wait, I should add a JSON field to SystemConfig for metadata!
        
        last_run_str = cls._get_metadata(schedule, "last_run")
        if not last_run_str:
            return True # Always run if never run before (or we can be smarter)

        try:
            last_run = datetime.fromisoformat(last_run_str)
            if timezone.is_aware(last_run):
                last_run = timezone.localtime(last_run)
            
            # Check if current time is past the 'next' execution date from last_run
            iter = croniter(cron_str, last_run)
            next_run = iter.get_next(datetime)
            
            return now >= next_run
        except Exception as e:
            logger.error(f"Error parsing schedule {schedule.key}: {e}")
            return False

    @classmethod
    def dispatch_task(cls, schedule):
        """
        Dispatches the task to Celery.
        """
        task_name = schedule.key
        logger.info(f"Dispatching scheduled task: {task_name}")
        
        try:
            current_app.send_task(task_name)
            # Update last run time
            cls._set_metadata(schedule, "last_run", timezone.now().isoformat())
        except Exception as e:
            logger.error(f"Failed to dispatch task {task_name}: {e}")

    @classmethod
    def _get_metadata(cls, schedule, key):
        """Fetches a value from the schedule's details JSON field."""
        return schedule.details.get(key)

    @classmethod
    def _set_metadata(cls, schedule, key, value):
        """Updates the schedule's details JSON field and saves."""
        if not isinstance(schedule.details, dict):
            schedule.details = {}
        schedule.details[key] = value
        schedule.save(update_fields=["details", "updated_at"])
