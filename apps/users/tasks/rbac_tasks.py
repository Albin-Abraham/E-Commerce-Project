# apps/users/tasks/rbac_tasks.py
from celery import shared_task
from django.db.models.signals import post_save, m2m_changed
from django.dispatch import receiver
from django.core.cache import cache
from django.db.models import Q
from apps.users.models.permissions import RolePermissions, RoleGroupPermissions, UserPermissionModel
from apps.users.models.catalog import BranchCatalog
from apps.users.models.users import UserProfileModel
from apps.users.utils.rbac_manifest import ManifestOrchestrator

@shared_task
def rebuild_manifest_task(user_id, branch_id=None):
    """
    Background task to refresh the FrozenSet manifest for a user.
    Aggregates Roles, Groups, and BranchCatalog-level permissions.
    """
    return ManifestOrchestrator.build_for_user(user_id, branch_id, force_rebuild=True)


def _invalidate_users(user_ids):
    """Helper to clear cache and trigger rebuild for a set of user_ids."""
    for uid in user_ids:
        if hasattr(cache, 'delete_pattern'):
            cache.delete_pattern(f"rbac_manifest:{uid}:*")
        rebuild_manifest_task.delay(uid)


def _affected_users_by_role(role):
    """Return set of user_ids that reference the given role (directly or via groups)."""
    direct = set(role.user_assignments.values_list('user_id', flat=True))
    via_groups = set(
        UserPermissionModel.objects
        .filter(groups__roles=role)
        .values_list('user_id', flat=True)
    )
    return direct | via_groups


# --- SIGNALS ---

@receiver(post_save, sender=RolePermissions)
def role_permissions_change_handler(sender, instance, **kwargs):
    """
    Targeted invalidation: only invalidate users who reference this role.
    """
    user_ids = _affected_users_by_role(instance)
    if user_ids:
        _invalidate_users(user_ids)


@receiver(post_save, sender=RoleGroupPermissions)
def role_group_permissions_change_handler(sender, instance, **kwargs):
    """
    Targeted invalidation: invalidate users directly assigned to the group,
    plus users who hold any role that belongs to this group.
    """
    user_ids = set(
        instance.user_assignments.values_list('user_id', flat=True)
    )
    for role in instance.roles.all():
        user_ids |= _affected_users_by_role(role)

    if user_ids:
        _invalidate_users(user_ids)


@receiver(m2m_changed, sender=RoleGroupPermissions.roles.through)
def role_group_roles_changed_handler(sender, instance, action, **kwargs):
    """
    When roles are added/removed from a group, invalidate users assigned
    to the group or the affected roles.
    """
    if action not in ('post_add', 'post_remove', 'post_clear'):
        return

    user_ids = set(
        instance.user_assignments.values_list('user_id', flat=True)
    )
    for role in instance.roles.all():
        user_ids |= _affected_users_by_role(role)

    if user_ids:
        _invalidate_users(user_ids)


@receiver(post_save, sender=BranchCatalog)
def branch_catalog_change_handler(sender, instance, **kwargs):
    """
    Targeted invalidation: only invalidate users whose branch uses this catalog.
    """
    user_ids = set(
        UserProfileModel.objects
        .filter(branch__catalog=instance)
        .values_list('user_id', flat=True)
    )
    if user_ids:
        _invalidate_users(user_ids)


@receiver(post_save, sender=UserPermissionModel)
@receiver(m2m_changed, sender=UserPermissionModel.roles.through)
@receiver(m2m_changed, sender=UserPermissionModel.groups.through)
def user_rbac_change_handler(sender, instance, action=None, **kwargs):
    """
    Handle changes to a specific user's assignments.
    """
    if sender is not UserPermissionModel and action not in ('post_add', 'post_remove', 'post_clear'):
        return

    user_id = instance.user_id if hasattr(instance, 'user_id') else instance.id
    if hasattr(cache, 'delete_pattern'):
        cache.delete_pattern(f"rbac_manifest:{user_id}:*")
    rebuild_manifest_task.delay(user_id)
