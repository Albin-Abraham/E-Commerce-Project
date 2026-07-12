# backend/settings/base.py
import os
import environ
from pathlib import Path

# Initialize environment variables
env = environ.Env(
    DEBUG=(bool, False),
    SECRET_KEY=(str, 'django-insecure-fallback'),
)

BASE_DIR = Path(__file__).resolve().parent.parent.parent

# --- Configuration Hierarchy Integration ---
def get_system_default_timezone():
    """
    Reads the system_timezone from the core YAML config as a secondary source of truth.
    """
    config_path = BASE_DIR / "core" / "base_models" / "configs" / "system_config.yaml"
    if config_path.exists():
        try:
            # Using a simple read to avoid heavy yaml dependency at settings load 
            # if we want to keep it lightweight, but PyYAML is already a dependency.
            import yaml
            with open(config_path, 'r') as f:
                data = yaml.safe_load(f)
                configs = data.get('system_conf_key', [])
                for cfg in configs:
                    if cfg.get('key') == 'system_timezone':
                        return cfg.get('value', 'UTC')
        except Exception:
            pass
    return 'UTC'

# The "LocalDate" concept: Single source of truth for the system's timezone
# Priority: 1. Environment Variable (.env) | 2. System Configuration (YAML) | 3. Hardcoded Fallback (UTC)
DEFAULT_TIME_ZONE = env('TIME_ZONE', default=get_system_default_timezone())

# Read .env file if it exists
environ.Env.read_env(os.path.join(BASE_DIR, '.env'))

from core.registry import AppRegistry

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'rest_framework_simplejwt.token_blacklist',
    'drf_spectacular',
] + AppRegistry.discover()


MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'core.admin.utils.context.RequestContextMiddleware',
]

ROOT_URLCONF = 'backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'backend.wsgi.application'

AUTH_USER_MODEL = 'users.UserModel'

ADMIN_URL = 'admin-interface/'

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = DEFAULT_TIME_ZONE
USE_I18N = True
USE_TZ = True # Internal storage in UTC, presentation/logic in TIME_ZONE

STATIC_URL = '/static/'

STATIC_ROOT = BASE_DIR /'static'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


REST_FRAMEWORK = {
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'core.admin.authentication.PlatformAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',  
    'EXCEPTION_HANDLER': 'core.base_models.exception_handlers.platform_exception_handler',
}

# --- Celery Configuration ---
CELERY_BROKER_URL = env('CELERY_BROKER_URL', default='redis://redis:6379/0')
CELERY_RESULT_BACKEND = env('CELERY_RESULT_BACKEND', default='redis://redis:6379/0')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'

# Global Consistency: Align Celery Workers & Beat with the system's Local Timezone
CELERY_ENABLE_UTC = True # Store as UTC internally for integrity
CELERY_TIMEZONE = TIME_ZONE # Schedules in Beat will respect this

CELERY_TASK_STARTED = True
CELERY_TASK_TIME_LIMIT = 30 * 60  # 30 minutes

# --- Celery Beat Schedule ---
CELERY_BEAT_SCHEDULE = {
    'scheduled-heartbeat-every-5-minutes': {
        'task': 'core.admin.tasks.scheduled_heartbeat',
        'schedule': 300.0,  # 5 minutes
    },
    'system-sync-heartbeat-every-minute': {
        'task': 'core.base_models.tasks.system_sync_heartbeat',
        'schedule': 60.0,  # 1 minute
    },
}

# --- Cache & Session Configuration ---
CACHES = {
    "default": env.cache_url('CACHE_URL', default='redis://redis:6379/1')
}

# Route Django Sessions to use the high-performance Redis cache instead of PostgreSQL
SESSION_ENGINE = "django.contrib.sessions.backends.cache"
SESSION_CACHE_ALIAS = "default"


# --- Industrialization & Infrastructure Control ---
METADATA_CACHE_ENABLED = env.bool('METADATA_CACHE_ENABLED', default=True)
METADATA_CACHE_TTL = env.int('METADATA_CACHE_TTL', default=3600)
BULK_OPERATION_THRESHOLD = env.int('BULK_OPERATION_THRESHOLD', default=50)
THROTTLE_RATE_DEFAULT = env.str('THROTTLE_RATE_DEFAULT', default='1000/day')
CELERY_TASK_RATE_LIMIT = env.str('CELERY_TASK_RATE_LIMIT', default='50/m')


# --- OpenAPI / Swagger Configuration ---
# SPECTACULAR_SETTINGS = {
#     'TITLE': 'Zenith Healthcare Platform API',
#     'DESCRIPTION': (
#         'Industrialized Backend-RestFul architecture featuring '
#         'Multi-tenant context, Rules Engine validation, and '
#         'Hybrid JWT/Session authentication.'
#     ),
#     'VERSION': '1.0.0',
#     'SERVE_INCLUDE_SCHEMA': False,
#     'SERVE_PERMISSIONS': ['rest_framework.permissions.AllowAny'],
#     'SERVE_AUTHENTICATION': [],
#     'COMPONENT_SPLIT_PATCH': True,
#     'COMPONENT_SPLIT_REQUEST': True,
#     'SECURITY': [
#         {'jwtAuth': []},
#         {'SessionAuth': []},
#         {'csrfAuth': []},
#     ],
#     'APPEND_COMPONENTS': {
#         'securitySchemes': {
#             'jwtAuth': {
#                 'type': 'http',
#                 'scheme': 'bearer',
#                 'bearerFormat': 'JWT',
#             },
#             'SessionAuth': {
#                 'type': 'apiKey',
#                 'in': 'cookie',
#                 'name': 'sessionid',
#             },
#             'csrfAuth': {
#                 'type': 'apiKey',
#                 'in': 'header',
#                 'name': 'X-CSRFToken',
#             },
#         }
#     },
# }
# AUTHENTICATION_BACKENDS = [
#     'core.admin.authentication.MultiFieldAuthBackend',
#     'django.contrib.auth.backends.ModelBackend',
# ]

# # --- SimpleJWT / Hybrid Auth Configuration ---
# from datetime import timedelta
# SIMPLE_JWT = {
#     'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
#     'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
#     'ROTATE_REFRESH_TOKENS': True,
#     'BLACKLIST_AFTER_ROTATION': True,
#     'AUTH_HEADER_TYPES': ('Bearer',),
#     'AUTH_COOKIE': 'access_token',  # Standardized cookie name for hybrid auth
# }

