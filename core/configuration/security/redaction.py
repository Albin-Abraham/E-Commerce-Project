# core/configuration/security/redaction.py
"""
Utility for redacting sensitive configuration values (API keys, secrets, passwords).
"""


def mask_secret(value: str | None, visible_prefix: int = 4, visible_suffix: int = 2) -> str:
    """
    Masks a sensitive string preserving only a short prefix and suffix.
    E.g., 'rzp_test_1234567890abcdef' -> 'rzp_******************ef'

    If the secret is None or empty, returns an empty string or '[EMPTY]'.
    If the secret is shorter than visible_prefix + visible_suffix + 2,
    it returns '***' to avoid revealing short secrets entirely.
    """
    if not value:
        return "[NOT SET]"

    val_str = str(value)
    length = len(val_str)

    if length <= (visible_prefix + visible_suffix + 1):
        return "***"

    prefix = val_str[:visible_prefix]
    suffix = val_str[-visible_suffix:] if visible_suffix > 0 else ""
    masked_count = length - visible_prefix - visible_suffix

    return f"{prefix}{'*' * min(masked_count, 12)}{suffix}"
