from django.apps import AppConfig

class UsersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.users'
    label = "users"

    def ready(self):
        # Register RBAC Signals
        import apps.users.tasks.rbac_tasks
