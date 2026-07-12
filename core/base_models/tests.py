import pytest
from core.base_models.system_models import SystemConfig, SystemHealth, SystemModule
from core.base_models.services.orchestration_service import OrchestrationService
from core.base_models.services.scheduler_service import SystemConfigSchedulerService

from core.base_models.validator_model import bypass_mediator_guard

@pytest.mark.django_db
class TestSystemModelsOrchestration:
    """
    Test suite for the new System Health & Orchestration Layer.
    """

    def test_system_config_grouping(self):
        """Verify hierarchical grouping in SystemConfig."""
        with bypass_mediator_guard():
            parent = SystemConfig.objects.create(key="PARENT_GROUP", value=None)
            child = SystemConfig.objects.create(key="CHILD_CONFIG", value="test", parent_group=parent)
        
        assert parent.is_group is True
        assert child.is_group is False
        assert child.parent_group == parent

    def test_system_config_load_val(self):
        """Verify the load_val utility."""
        with bypass_mediator_guard():
            SystemConfig.objects.create(key="TEST_KEY", value="123")
        assert SystemConfig.load_val("TEST_KEY") == "123"
        assert SystemConfig.load_val("NON_EXISTENT", "default") == "default"

    from django.test import override_settings
    @override_settings(TESTING=False, BYPASS_VALIDATION_GUARD=True)
    def test_orchestration_bootstrap(self):
        """Verify the bootstrap process creates health records."""
        # Ensure table is clean for test
        SystemHealth.objects.all().delete()
        
        # Execute health check explicitly to persist records
        OrchestrationService.health_check(persist=True)
        
        assert SystemHealth.objects.filter(component_name="PostgreSQL").exists()
        assert SystemHealth.objects.filter(component_name="Redis").exists()
        assert SystemHealth.objects.filter(component_name="Celery").exists()

    def test_scheduler_service_detection(self):
        """Verify cron scheduling detection."""
        with bypass_mediator_guard():
            group, _ = SystemConfig.objects.get_or_create(key='CELERY_SCHEDULE')
            config = SystemConfig.objects.create(
                key='test_task',
                parent_group=group,
                value='* * * * *'
            )
        
        # This shouldn't crash and should correctly parse the cron
        should_run = SystemConfigSchedulerService.should_dispatch(config)
        assert isinstance(should_run, bool)

@pytest.mark.django_db
class TestSystemModulesSeed:
    """Verify that SystemModule records are correctly handled."""
    
    def test_module_creation(self):
        with bypass_mediator_guard():
            module = SystemModule.objects.create(code="TEST_MOD", name="Test Module")
        assert str(module) == "Test Module (TEST_MOD)"
