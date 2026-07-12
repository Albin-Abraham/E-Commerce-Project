from django.apps import AppConfig


class CoreBaseModelsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'core.base_models'
    label = "core_base_models"
    verbose_name = "Core Base Models"

    def ready(self):
        """
        Triggers the BootService/Orchestration bootstrap on application startup.
        """
        from django.conf import settings
        
        # Avoid running bootstrap during tests, migrations, or other maintenance tasks
        if getattr(settings, 'TESTING', False):
            return

        import sys
        ignored_commands = {
            'makemigrations', 'migrate', 'collectstatic', 'seeds_data', 'shell'
        }
        
        is_management = any(
            any(cmd in arg for cmd in ignored_commands) 
            for arg in sys.argv
        )

        if not is_management:
            try:
                from core.base_models.services.orchestration_service import OrchestrationService
                OrchestrationService.bootstrap()
            except Exception as e:
                # Log but dont crash the app if bootstrap fails (e.g. DB not ready yet)
                import logging
                logging.getLogger(__name__).warning(f"System Bootstrap deferred or failed: {e}")
