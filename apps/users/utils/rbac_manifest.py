# apps/users/utils/rbac_manifest.py
from dataclasses import dataclass, field
from typing import Any, Optional, Set, List, Dict, FrozenSet
from django.db.models import Prefetch
from django.core.cache import cache
import json

@dataclass(frozen=True)
class PermissionManifest:
    """
    DataClass: A high-performance, frozen snapshot of a user's RBAC state.
    Provides O(1) lookups for permission keys via FrozenSets.
    """
    user_id: str
    effective_permissions: frozenset[str]
    roles: frozenset[str]
    groups: frozenset[str]
    metadata: Dict[str, Any] = field(default_factory=dict)

    def has_perm(self, key: str) -> bool:
        return key in self.effective_permissions

    def to_dict(self) -> Dict[str, Any]:
        """Convert to a JSON-serializable dictionary."""
        return {
            "user_id": self.user_id,
            "effective_permissions": list(self.effective_permissions),
            "roles": list(self.roles),
            "groups": list(self.groups),
            "metadata": self.metadata
        }

class ManifestOrchestrator:
    """
    GoF Orchestrator: Resolves recursive RBAC structures into a flat manifest.
    Optimized via prefetching and caching.
    """
    @classmethod
    def build_for_user(cls, user_id: Any, branch_id: Optional[Any] = None, force_rebuild: bool = False) -> PermissionManifest:
        """
        Resolves RBAC structures into a flat manifest.
        Intersects with BranchCatalog if a branch_id is provided.
        """
        cache_key = f"rbac_manifest:{user_id}:{branch_id or 'global'}"
        
        if not force_rebuild:
            cached_data = cache.get(cache_key)
            if cached_data:
                d = json.loads(cached_data)
                return PermissionManifest(
                    user_id=d['user_id'],
                    effective_permissions=frozenset(d['effective_permissions']),
                    roles=frozenset(d['roles']),
                    groups=frozenset(d['groups']),
                    metadata=d.get('metadata', {})
                )

        from apps.users.models.permissions import UserPermissionModel
        from core.admin.models.branch import Branch
        
        # 1. Fetch the user's assignment with prefetching
        try:
            assignment = UserPermissionModel.objects.prefetch_related(
                'roles',
                'groups',
                'groups__roles'
            ).get(user_id=user_id)
        except UserPermissionModel.DoesNotExist:
            manifest = PermissionManifest(
                user_id=str(user_id), 
                effective_permissions=frozenset(), 
                roles=frozenset(), 
                groups=frozenset()
            )
            cls._cache_manifest(cache_key, manifest)
            return manifest

        permissions: Set[str] = set()
        roles: Set[str] = set()
        groups: Set[str] = set()

        # 2. Collect Permissions
        permissions.update(assignment.direct_permissions or [])
        for role in assignment.roles.all():
            roles.add(role.name)
            permissions.update(role.permission_keys or [])
        for group in assignment.groups.all():
            groups.add(group.name)
            permissions.update(group.permission_keys or [])
            for role in group.roles.all():
                roles.add(role.name)
                permissions.update(role.permission_keys or [])

        # 3. SaaS Filter: Intersection with BranchCatalog + Subscription
        if branch_id:
            try:
                branch = Branch.objects.select_related('catalog', 'company__subscription').get(id=branch_id)
                
                # 3a. Catalog-level filter
                if branch.catalog:
                    allowed = set(branch.catalog.allowed_permission_keys or [])
                    permissions = permissions.intersection(allowed)
                
                # 3b. Subscription-level module filter (defense-in-depth)
                if branch.company_id and branch.company.subscription_id:
                    subscription = branch.company.subscription
                    allowed_modules = set(subscription.modules or [])
                    if allowed_modules:
                        filtered = set()
                        for key in permissions:
                            parts = key.split(":")
                            # <3 segments = custom verb keys, pass through
                            if len(parts) < 3 or parts[0] in allowed_modules:
                                filtered.add(key)
                        permissions = filtered
            except Branch.DoesNotExist:
                pass

        # 4. Enrich with Metadata
        from core.admin.utils.module_navigator import navigator
        metadata_dict = {}
        for key in permissions:
            meta = navigator.get_module_metadata(key)
            if meta:
                metadata_dict[key] = meta

        manifest = PermissionManifest(
            user_id=str(user_id),
            effective_permissions=frozenset(permissions),
            roles=frozenset(roles),
            groups=frozenset(groups),
            metadata=metadata_dict
        )
        
        cls._cache_manifest(cache_key, manifest)
        return manifest

    @classmethod
    def _cache_manifest(cls, key: str, manifest: PermissionManifest):
        """Serialize and store in Redis/Cache."""
        data = {
            "user_id": manifest.user_id,
            "effective_permissions": list(manifest.effective_permissions),
            "roles": list(manifest.roles),
            "groups": list(manifest.groups),
            "metadata": manifest.metadata
        }
        cache.set(key, json.dumps(data), timeout=3600)
