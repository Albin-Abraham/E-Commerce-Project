# core/admin/constants.py

# System-wide Identifiers (Industrialized Name-Driven Anchors)
SYSTEM_COMPANY_NAME = "System"
SYSTEM_COMPANY_CODE = "system"

SYSTEM_BRANCH_NAME = "__All__"
SYSTEM_BRANCH_CODE = "all"

# Legacy support (Aliases for lookup keys)
SYSTEM_COMPANY = SYSTEM_COMPANY_NAME
ALL_BRANCH = SYSTEM_BRANCH_NAME

# --- Industrialized Header Registry ---
# Centralized source of truth for all platform-aware headers.
class PlatformHeaders:
    PLATFORM = "X-Platform"      # web, ios, android
    TENANT = "X-Tenant-ID"       # Company Scoping
    TENANT_BUSINESS_UNIT = "X-Business-Unit-ID" # Business Unit Scoping
    TENANT_BRANCH = "X-Branch-ID" # Branch Scoping
    REQUEST_ID = "X-Request-ID"  # Traceability
    PLATFORM_VERSION = "X-App-Version"
    LOG_LEVEL = "X-Log-Level"

# PlatformHeaders = PlatformHeaders()

# --- Industrialized Cookie Registry ---
class PlatformCookies:
    ACCESS_TOKEN = "access_token"
    REFRESH_TOKEN = "refresh_token"
    CSRF_TOKEN = "csrftoken"
    SESSION_ID = "sessionid"
