# core/base_models/constants.py
from django.core.validators import MinValueValidator, MaxValueValidator, RegexValidator
from django.utils import timezone
from django.conf import settings
from core.base_models.validators.email_validator import (
    EMAIL_REGEX_VALIDATOR,
    validate_email_domain,
)

# ===============================
# Default Field Lengths (Policies)
# ===============================
SHORT_CHAR_LENGTH = 50
MEDIUM_CHAR_LENGTH = 100
DEFAULT_CHAR_LENGTH = 255
LONG_CHAR_LENGTH = 500
DEFAULT_TEXT_LENGTH = 1000
SLUG_MAX_LENGTH = 50
USERNAME_MAX_LENGTH = 150
NAME_MAX_LENGTH = 255
EMAIL_MAX_LENGTH = 254 

# ===============================
# Choice Defaults
# ===============================
BOOLEAN_CHOICES = [
    (True, 'Yes'),
    (False, 'No')
]

STATUS_CHOICES = [
    ('active', 'Active'),
    ('inactive', 'Inactive'),
    ('pending', 'Pending'),
    ('deleted', 'Deleted'),
]

# ===============================
# Numeric / Decimal Settings
# ===============================
DEFAULT_DECIMAL_MAX_DIGITS = 10
DEFAULT_DECIMAL_DECIMAL_PLACES = 2
POSITIVE_INTEGER_VALIDATOR = MinValueValidator(0)
PERCENT_VALIDATOR = [MinValueValidator(0), MaxValueValidator(100)]

# ===============================
# Common Validators
# ===============================
PHONE_VALIDATOR = RegexValidator(
    regex=r'^\+?1?\d{9,15}$',
    message='Phone number must be entered in the format: +999999999. Up to 15 digits allowed.'
)

# ===============================
# Date / Time Utils
# ===============================
NOW = timezone.now

# ===============================
# User / Auth Constants
# ===============================
USER_MODEL = settings.AUTH_USER_MODEL 
