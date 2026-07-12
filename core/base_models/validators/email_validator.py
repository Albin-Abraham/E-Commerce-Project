# core/validators/email_valiator.py
from django.core.validators import RegexValidator
from django.core.exceptions import ValidationError

# Basic regex to check general email format
EMAIL_REGEX_VALIDATOR = RegexValidator(
    regex=r'^[\w\.-]+@([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$',
    message='Enter a valid email address with a proper domain.',
    code='invalid_email'
)


# List of allowed top-level domains (TLDs)
VALID_TLDS = ['com', 'org', 'net', 'edu', 'gov', 'io', 'co', 'in']

def validate_email_domain(value: str):
    """
    Validates that the email domain ends with one of the allowed TLDs.
    Raises ValidationError if not valid.
    """
    try:
        domain_part = value.split('@')[1].lower()  # get part after @
    except IndexError:
        raise ValidationError("Invalid email format.", code="invalid_email")

    # Extract the TLD (after last dot)
    tld = domain_part.split('.')[-1]
    if tld not in VALID_TLDS:
        raise ValidationError(
            f"Email domain TLD '.{tld}' is not allowed. Allowed TLDs: {', '.join(VALID_TLDS)}",
            code="invalid_email_tld"
        )
