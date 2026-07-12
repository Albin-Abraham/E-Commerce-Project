# core/admin/utils/module_navigator.py
import yaml
import os
from pathlib import Path
from typing import Dict, List, Any, Optional, Set

class ModuleNavigator:
    """
    GoF Flyweight/Singleton: Central navigator for dynamic modules and permissions.
    Parses core/base_models/configs/modules.yaml to provide validation and metadata.
    """
    _instance: Optional['ModuleNavigator'] = None
    _config: Optional[Dict[str, Any]] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ModuleNavigator, cls).__new__(cls)
            cls._instance._load_config()
        return cls._instance

    def _load_config(self):
        config_path = Path(__file__).resolve().parent.parent.parent / "base_models" / "configs" / "modules.yaml"
        
        try:
            with open(config_path, 'r') as f:
                data = yaml.safe_load(f)
                self._config = data.get('systems', {}) if data else {}
        except Exception as e:
            print(f"Error loading modules.yaml: {e}")
            self._config = {}

    def get_all_permission_keys(self) -> Set[str]:
        """Returns a flat set of all possible 'system:module:feature' keys."""
        keys: Set[str] = set()
        config = self._config
        if not config:
            return keys
        
        for sys_id, sys_data in config.items():
            for mod_id, mod_data in sys_data.get('modules', {}).items():
                for feat_id in mod_data.get('features', []):
                    keys.add(f"{sys_id}:{mod_id}:{feat_id}")
        return keys

    def get_module_metadata(self, key: str) -> Optional[Dict[str, Any]]:
        """
        Parses a key like 'hrms:employee:profile' and returns metadata.
        For custom verb keys (e.g. 'company:import') returns minimal metadata
        based on the prefix segment.
        """
        config = self._config
        if not config:
            return None

        parts = key.split(':')
        if len(parts) < 3:
            # Short keys (e.g. prefix:verb) — try prefix as system
            sys_id = parts[0]
            sys_data = config.get(sys_id, {})
            if sys_data:
                return {
                    "system_name": sys_data.get('name'),
                    "module_name": "",
                    "feature": ":".join(parts[1:]),
                    "description": sys_data.get('description'),
                }
            return None

        try:
            sys_id, mod_id, feat_id = parts[0], parts[1], ":".join(parts[2:])
            sys_data = config.get(sys_id, {})
            mod_data = sys_data.get('modules', {}).get(mod_id, {})
            if feat_id in mod_data.get('features', []):
                return {
                    "system_name": sys_data.get('name'),
                    "module_name": mod_data.get('name'),
                    "feature": feat_id,
                    "description": sys_data.get('description'),
                }
            # Fallback: return module-level metadata even if feature not listed
            if mod_data:
                return {
                    "system_name": sys_data.get('name'),
                    "module_name": mod_data.get('name'),
                    "feature": feat_id,
                    "description": sys_data.get('description'),
                }
        except (ValueError, AttributeError):
            pass
        return None

    def validate_dependencies(self, enabled_system_ids: List[str]) -> List[str]:
        """
        Checks if the provided list of system IDs satisfies all dependencies.
        Returns a list of missing system IDs.
        """
        config = self._config
        if not config:
            return []
        enabled_set = set(enabled_system_ids)
        missing: Set[str] = set()
        for sys_id in enabled_set:
            deps = config.get(sys_id, {}).get('dependencies', [])
            for dep in deps:
                if dep not in enabled_set:
                    missing.add(str(dep))
        return list(missing)

    def get_structured_manifest(self) -> Dict[str, Any]:
        """Returns the full hierarchy for UI selection components."""
        return self._config or {}

# Singleton instance for easy access
navigator = ModuleNavigator()
