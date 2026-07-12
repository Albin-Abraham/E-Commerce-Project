# tests/pytest_settings.py
import os
from backend.settings.base import *

DEBUG = True
SECRET_KEY = 'test-secret-key'

# Use SQLite for testing
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

# Use Local Memory Cache for testing
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
    }
}

# Dummy Celery broker
CELERY_BROKER_URL = 'memory://'
CELERY_RESULT_BACKEND = 'cache+memory://'
CELERY_TASK_ALWAYS_EAGER = True

# Disable some problematic apps or settings if needed
INSTALLED_APPS = [app for app in INSTALLED_APPS if app != 'django_celery_results']

# Mock environments
os.environ['DEBUG'] = 'True'
os.environ['SECRET_KEY'] = SECRET_KEY
os.environ['CACHE_URL'] = 'locmem://'
