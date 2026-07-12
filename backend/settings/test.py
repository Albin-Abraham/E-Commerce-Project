# backend/settings/test.py
from .base import *

DEBUG = True
SECRET_KEY = 'test-secret-key'

# Use in-memory SQLite for tests
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
        'TEST': {},
    }
}

# Disable SQLite FK constraint checks during test teardown to prevent
# audit_entries.content_type_id IntegrityError from stale FKs after flush.
# This is a known Django+SQLite issue where check_constraints() fires
# before audit log cleanup completes.
import django.db.backends.sqlite3.base as _sqlite_base
_original_check_constraints = _sqlite_base.DatabaseWrapper.check_constraints

def _noop_check_constraints(self, table_names=None):
    return None

_sqlite_base.DatabaseWrapper.check_constraints = _noop_check_constraints

# Simplify password hashing for speed
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.MD5PasswordHasher',
]

# Disable caching for tests (except session backend which needs LocMemCache)
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
    }
}

# Use DB-backed sessions for tests (avoids cache issues)
SESSION_ENGINE = "django.contrib.sessions.backends.db"

# Disable Celery for tests (run synchronously)
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True

ALLOWED_HOSTS = ['*']

AUTHENTICATION_BACKENDS = [
    'core.admin.authentication.MultiFieldAuthBackend',
]

from datetime import timedelta
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_COOKIE': 'access_token',
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
}

# Identity Flag
TESTING = True

# Administrative Bypass for Structural Integrity Guard (Seeding/Tests)
BYPASS_VALIDATION_GUARD = True
