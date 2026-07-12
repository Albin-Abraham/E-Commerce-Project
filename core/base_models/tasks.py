import logging
from celery import shared_task
from core.base_models.services.scheduler_service import SystemConfigSchedulerService
from core.base_models.services.orchestration_service import OrchestrationService

logger = logging.getLogger(__name__)

@shared_task(name="core.base_models.tasks.system_sync_heartbeat")
def system_sync_heartbeat():
    """
    Main orchestration task for the platform.
    1. Checks the health of all dependencies (AppDispatcher logic).
    2. Synchronizes dynamic schedules from SystemConfig.
    """
    logger.debug("--- [System Heartbeat] Starting Sync ---")
    
    # 1. Orchestration: Dependency Health & Connectivty
    OrchestrationService.health_check()
    
    # 2. Dynamic Scheduling: Dispatch tasks from SystemConfig
    SystemConfigSchedulerService.dispatch_all()
    
    logger.debug("--- [System Heartbeat] Sync Complete ---")
