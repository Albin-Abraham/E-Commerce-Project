# apps/users/models/permissions.py
from django.db import models
from core.base_models.validator_model import BaseModel
from core.base_models.fields.char_fields import CustomCharField
from core.base_models.fields.short_ui_fields import CustomShortUUIDField

class RolePermissions(BaseModel):
    """
    GoF Strategy Pattern: Collection of Permission Keys for a named Role.
    Example: 'Company Admin' -> ['company:view', 'company:edit']
    """
    id = CustomShortUUIDField(primary_key=True)
    name = CustomCharField(max_length=100, unique=True, verbose_name="Role Name")
    description = models.TextField(blank=True)
    
    # PermissionKeys: List of strings like 'resource:action'
    permission_keys = models.JSONField(
        default=list, 
        blank=True,
        help_text="List of technical permission keys (e.g., resource:action)"
    )

    class Meta:
        db_table = "role_permissions"
        verbose_name = "Role Permission"
        verbose_name_plural = "Role Permissions"

    def __str__(self):
        return self.name

class RoleGroupPermissions(BaseModel):
    """
    GoF Composite Pattern: Groups multiple Roles and bulk Permission Keys.
    Allows for hierarchy-like structures or functional groupings.
    """
    id = CustomShortUUIDField(primary_key=True)
    name = CustomCharField(max_length=100, unique=True, verbose_name="Group Name")
    
    roles = models.ManyToManyField(
        RolePermissions, 
        related_name="role_groups",
        blank=True
    )
    
    # Bulk assignment: Direct keys for this group
    permission_keys = models.JSONField(
        default=list, 
        blank=True,
        help_text="Bulk permission keys assigned directly to this group"
    )

    class Meta:
        db_table = "role_group_permissions"
        verbose_name = "Role Group"
        verbose_name_plural = "Role Groups"

    def __str__(self):
        return self.name

class UserPermissionModel(BaseModel):
    """
    The Assignment table connecting Users to Roles, Groups, and Overrides.
    """
    user = models.OneToOneField(
        "users.UserModel", 
        on_delete=models.CASCADE, 
        related_name="rbac_assignment"
    )
    
    roles = models.ManyToManyField(
        RolePermissions, 
        related_name="user_assignments",
        blank=True
    )
    
    groups = models.ManyToManyField(
        RoleGroupPermissions, 
        related_name="user_assignments",
        blank=True
    )
    
    # Specific per-user overrides
    direct_permissions = models.JSONField(
        default=list, 
        blank=True,
        help_text="Direct permission key overrides for this specific user"
    )

    class Meta:
        db_table = "user_permission_assignments"
        verbose_name = "User Permission"
        verbose_name_plural = "User Permissions"

    def __str__(self):
        return f"Permissions for {self.user.username}"