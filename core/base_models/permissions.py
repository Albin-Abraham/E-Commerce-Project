from typing import Dict, List, Optional


class PermissionPolicyMixin:
    """
    Developer-declared permission schema.

    Models declare a ``permission_prefix`` (the resource namespace, e.g.
    ``"hrms:employee"``) and a ``permission_map`` that maps each DRF action
    to a custom verb suffix.

    The final permission key stored in RBAC is ``{prefix}:{verb}``, e.g.
    ``"hrms:employee:can_create_profile"``.

    No auto-generation — every action-key mapping is explicit.
    """

    permission_prefix: str = ""
    permission_map: Dict[str, str] = {}

    @classmethod
    def get_required_permission_for_action(cls, action: str) -> Optional[str]:
        verb = cls.permission_map.get(action)
        if verb is None:
            return None
        prefix = cls.permission_prefix or cls.__name__.lower()
        return f"{prefix}:{verb}"

    @classmethod
    def get_declared_permissions(cls) -> List[tuple]:
        perms = []
        for verb in cls.permission_map.values():
            prefix = cls.permission_prefix or cls.__name__.lower()
            key = f"{prefix}:{verb}"
            perms.append((key, key.replace(":", " ").replace("_", " ").title()))
        return perms
