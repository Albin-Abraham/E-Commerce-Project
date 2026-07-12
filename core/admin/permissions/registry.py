import re
from typing import Dict, Any

# 1. Resource Permission Keys (The Source of Truth)
companyPermissionKeys = {
    "VIEW": "company:view",
    "CREATE": "company:create",
    "EDIT": "company:edit",
    "DELETE": "company:delete",
    "IMPORT": "company:import",
    "EXPORT": "company:export",
    "AUDIT": "company:audit",
    "ANALYTICS": "can_get_company_analytics",
    "MANAGE": "can_manage_company_ledger",
}

businessUnitPermissionKeys = {
    "VIEW": "businessunit:view",
    "CREATE": "businessunit:create",
    "EDIT": "businessunit:edit",
    "DELETE": "businessunit:delete",
}

# 2. Formatting Helper
def format_permission_label(perm_key: str) -> str:
    """
    Transforms technical permission keys into polished, human-readable strings.
    
    Examples:
        'company:view' -> 'View Company'
        'can_get_company_analytics' -> 'Get Company Analytics'
        'businessunit:bulk_upload' -> 'Bulk Upload Business Unit'
    """
    # 1. Handle resource:action format
    if ":" in perm_key:
        parts = perm_key.split(":")
        # Reorder to 'Action Resource' for better UX (e.g. View Company)
        if len(parts) == 2:
            resource, action = parts
            label = f"{action} {resource}"
        else:
            label = " ".join(parts)
    
    # 2. Handle verbose format (can_get_*, can_manage_*)
    else:
        # Strip 'can_' prefix if it exists
        label = re.sub(r'^can_', '', perm_key)
        # Replace underscores with spaces
        label = label.replace("_", " ")

    # 3. Final cleaning (replace underscores/special chars and title case)
    label = label.replace("_", " ").strip()
    
    # Custom mappings for better phrasing
    replacements = {
        "edit": "Edit",
        "view": "View",
        "create": "Create",
        "delete": "Delete",
        "import": "Import",
        "export": "Export"
    }
    
    words = label.split()
    formatted_words = [replacements.get(w.lower(), w.capitalize()) for w in words]
    
    return " ".join(formatted_words)
