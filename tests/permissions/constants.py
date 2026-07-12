from typing import Dict, Tuple, Set

# YAML-defined keys from modules.yaml
VALID_YAML_KEYS: Set[str] = {
    "hrms:employee:profile",
    "hrms:employee:documents",
    "hrms:employee:directory",
    "hrms:employee:org_chart",
    "hrms:leave:leave_request",
    "hrms:leave:approval_workflow",
    "hrms:leave:accrual_rules",
    "hrms:leave:attendance_logs",
    "hrms:payroll:salary_processing",
    "hrms:payroll:payslips",
    "hrms:payroll:tax_declarations",
    "hrms:payroll:bonus_management",
    "operations:inventory:stock_tracking",
    "operations:inventory:warehouse_management",
    "operations:inventory:barcode_scanning",
    "operations:procurement:purchase_orders",
    "operations:procurement:vendor_management",
    "operations:procurement:rfq_process",
    "finance:accounts:ledger",
    "finance:accounts:invoicing",
    "finance:accounts:expense_tracking",
    "finance:budgeting:budget_allocation",
    "finance:budgeting:forecasting",
    "admin:identity:user_management",
    "admin:identity:role_configuration",
    "admin:identity:division_catalogs",
    "admin:security:audit_logs",
    "admin:security:two_factor_auth",
    "admin:security:ip_whitelisting",
}

INVALID_YAML_KEY: str = "nonexistent:module:feature"

# Custom verb keys (<3 colon segments, bypass YAML validation)
CUSTOM_KEYS: Set[str] = {
    "company:import",
    "company:view",
    "prefix:can_verb",
    "simple:key",
}

# Named permission sets for reusable test scenarios
ROLE_SETS: Dict[str, Tuple[str, ...]] = {
    "viewer": ("admin:security:audit_logs", "hrms:employee:profile"),
    "editor": ("admin:identity:can_manage_users",),
    "admin": ("admin:identity:can_configure_roles", "admin:security:audit_logs"),
    "finance": ("finance:accounts:ledger", "finance:budgeting:forecasting"),
    "hr_full": (
        "hrms:employee:profile",
        "hrms:leave:leave_request",
        "hrms:payroll:payslips",
    ),
}

GROUP_SETS: Dict[str, Tuple[str, ...]] = {
    "admin_team": ("admin:identity:role_configuration",),
    "hr_team": ("hrms:employee:profile",),
}

DIRECT_PERM_SETS: Dict[str, Tuple[str, ...]] = {
    "leave": ("hrms:leave:can_request_leave",),
    "expense": ("finance:accounts:expense_tracking",),
}

CATALOG_SETS: Dict[str, Dict] = {
    "hrms_lite": {
        "module_keys": ["hrms"],
        "keys": ["hrms:employee:profile"],
    },
    "full_hrms": {
        "module_keys": ["hrms"],
        "keys": ["hrms:employee:profile", "hrms:leave:leave_request"],
    },
    "operations": {
        "module_keys": ["hrms", "operations"],
        "keys": ["operations:inventory:stock_tracking"],
    },
}

COMPANY_PERMISSION_ACTIONS: Dict[str, str] = {
    "create": "company:create",
    "list": "company:view",
    "retrieve": "company:view",
    "update": "company:edit",
    "partial_update": "company:edit",
    "destroy": "company:delete",
    "bulk_upload": "company:import",
    "download_report": "company:export",
    "audit": "company:audit",
    "manage": "company:manage",
    "get_analytics": "company:can_get_analytics",
    "manage_ledger": "company:can_manage_ledger",
}
