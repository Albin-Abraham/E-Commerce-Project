# core/infrastructure/db/routers.py
import logging
from django.conf import settings

logger = logging.getLogger(__name__)


class PrimaryReplicaRouter:
    """
    Primary / Read-Replica Database Router.
    Directs read operations (SELECT) to 'replica' (if configured in DATABASES)
    or falls back to 'default' primary database.
    Directs write operations (INSERT, UPDATE, DELETE) exclusively to 'default'.
    Ensures migrations run only on 'default'.
    """

    def db_for_read(self, model, **hints):
        """Directs read operations to replica database if configured."""
        if "replica" in settings.DATABASES:
            return "replica"
        return "default"

    def db_for_write(self, model, **hints):
        """Directs write operations exclusively to primary database."""
        return "default"

    def allow_relation(self, obj1, obj2, **hints):
        """Allows relationships if both objects belong to primary or replica databases."""
        db_set = {"default", "replica"}
        if obj1._state.db in db_set and obj2._state.db in db_set:
            return True
        return None

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        """Ensures migrations only execute on the primary database."""
        return db == "default"
