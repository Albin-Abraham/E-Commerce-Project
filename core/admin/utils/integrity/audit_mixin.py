# core/admin/utils/integrity/audit_mixin.py
"""
Backward-compatible re-export.

``AuditMixin`` has moved to ``core.base_models.audit_mixin`` so that
``BaseModel`` can inherit from it without a layer-2 → layer-1 import
violation.

Prefer importing from the new location::

    from core.base_models.audit_mixin import AuditMixin
"""

from core.base_models.audit_mixin import AuditMixin

__all__ = [
    "AuditMixin",
]
