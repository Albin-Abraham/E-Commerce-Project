# backend/settings/dev.py
from .base import *
from datetime import timedelta

# SECRET KEY
SECRET_KEY = env('SECRET_KEY')

# DEBUG
DEBUG = env('DEBUG')

# Middleware
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
] + MIDDLEWARE

# Database
DATABASES = {
    'default': env.db_url('DATABASE_URL', default='postgres://postgres:pstgres@localhost:5432/legacy_db'),
}

AUTHENTICATION_BACKENDS = [
    'core.admin.authentication.MultiFieldAuthBackend',
    'django.contrib.auth.backends.ModelBackend',
]

# Allowed hosts
ALLOWED_HOSTS = env.list('ALLOWED_HOSTS', default=[
    '127.0.0.1', 
    'localhost', 
    '127.0.0.1:8070', 
    'localhost:8090'
])

# CORS (development)
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = [
    "http://127.0.0.1:8070",
    "http://localhost:8090",
]
CORS_ALLOW_CREDENTIALS = True

CORS_ALLOW_HEADERS = (
    "accept",
    "authorization",
    "content-type",
    "user-agent",
    "x-csrftoken",
    "x-requested-with",
    # Platform-specific headers for Multi-Tenant / Scoping
    # "x-business-unit-id",
    # "x-branch-id",
    # "x-company-id",
)

CORS_EXPOSE_HEADERS = (
    "content-disposition", # Crucial for file downloads on the frontend
)
# Django REST Framework
SPECTACULAR_SETTINGS = {
    'TITLE': 'Zenith Platform API',
    'DESCRIPTION': (
        'Industrialized Backend-RestFul architecture featuring '
        'Multi-tenant context, Rules Engine validation, and '
        'Hybrid JWT/Session authentication.'
    ),
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'SERVE_PERMISSIONS': ['rest_framework.permissions.AllowAny'],
    'SERVE_AUTHENTICATION': [],
    'COMPONENT_SPLIT_PATCH': True,
    'COMPONENT_SPLIT_REQUEST': True,
    'SECURITY': [
        {'jwtAuth': []},
        # {'SessionAuth': []},
        # {'csrfAuth': []},
    ],
    'APPEND_COMPONENTS': {
        'securitySchemes': {
            'jwtAuth': {
                'type': 'http',
                'scheme': 'bearer',
                'bearerFormat': 'JWT',
            },
            # 'SessionAuth': {
            #     'type': 'apiKey',
            #     'in': 'cookie',
            #     'name': 'sessionid',
            # },
            # 'csrfAuth': {
            #     'type': 'apiKey',
            #     'in': 'header',
            #     'name': 'X-CSRFToken',
            # },
        }
    },
}
AUTHENTICATION_BACKENDS = [
    'core.admin.authentication.MultiFieldAuthBackend',
    'django.contrib.auth.backends.ModelBackend',
]

# --- SimpleJWT / Hybrid Auth Configuration ---
from datetime import timedelta
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_COOKIE': 'access_token',  # Standardized cookie name for hybrid auth
}



SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=env.int("ACCESS_TOKEN_LIFETIME", default=525600)),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=env.int("REFRESH_TOKEN_LIFETIME", default=10080)),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "ALGORITHM": "HS256",
    "SIGNING_KEY": SECRET_KEY,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
}

