import os
import glob
import threading
from dataclasses import dataclass, field
from typing import Dict, List, Set, Optional

from django.conf import settings
from django.core.cache import cache
from django.utils import timezone

_local = threading.local()

@dataclass(frozen=True)
class ModuleDefinition:
    """Metadata for an ERP module."""
    key: str
    label: str
    description: str = ""
    is_premium: bool = False
    dependencies: Set[str] = field(default_factory=frozenset)
    last_validated: Optional[str] = None # ISO format timestamp

class ModuleRegistry:
    """
    Central lookup for all available ERP modules.
    Loaded dynamically from core/base_models/configs/modules.yaml.
    """
    _REGISTRY: Dict[str, ModuleDefinition] = {}
    _CACHE_KEY = "erp_module_registry"
    _LOADED = False

    @classmethod
    def load(cls, force=False):
        # 1. Try Local Memory (Request-level) first
        if hasattr(_local, "registry") and not force:
            cls._REGISTRY = _local.registry
            cls._LOADED = True
            return

        if cls._LOADED and not force:
            return
        
        # 2. Try Redis cache (O(1)) with a safety guard for connection issues
        try:
            cached_data = cache.get(cls._CACHE_KEY)
            if cached_data and not force:
                cls._REGISTRY = cached_data
                _local.registry = cached_data # Sync to local for request-lifecycle
                cls._LOADED = True
                return
        except Exception:
            # Redis is down - Degraded Mode: fallback to local/YAML
            pass

        # 3. Degraded Mode: Load from YAML (Sharded + Monolithic)
        config_dir = os.path.join(settings.BASE_DIR, 'core', 'base_models', 'configs')
        sharded_path = os.path.join(config_dir, 'modules', '*.yaml')
        monolithic_path = os.path.join(config_dir, 'modules.yaml')
        
        yaml_files = glob.glob(sharded_path)
        if os.path.exists(monolithic_path):
            yaml_files.append(monolithic_path)
            
        if not yaml_files:
            cls._LOADED = True
            return

        from core.admin.utils.integrity.time_registry import TimeRegistry
        new_registry = {}
        now_str = TimeRegistry.get_local_now().isoformat()
        
        import yaml
        for file_path in yaml_files:
            with open(file_path, 'r') as f:
                data = yaml.safe_load(f) or {}
                # The file might be a list of modules or a dict
                if isinstance(data, dict) and 'modules' in data:
                    data = data['modules']
                
                if not isinstance(data, dict):
                    continue

                for key, info in data.items():
                    new_registry[key] = ModuleDefinition(
                        key=key,
                        label=info.get('label', key.title()),
                        description=info.get('description', ""),
                        is_premium=info.get('is_premium', False),
                        dependencies=frozenset(info.get('dependencies', [])),
                        last_validated=now_str
                    )
        
        cls._REGISTRY = new_registry
        _local.registry = new_registry # Cache locally
        
        # 4. Try to update Redis (Fire and forget - suppress errors)
        try:
            cache.set(cls._CACHE_KEY, cls._REGISTRY, 86400)
        except Exception:
            pass
            
        cls._LOADED = True

    @classmethod
    def flush(cls):
        """Clear cache and force reload."""
        cache.delete(cls._CACHE_KEY)
        cls._LOADED = False
        cls.load(force=True)

    @classmethod
    def get_all_keys(cls) -> Set[str]:
        cls.load()
        return frozenset(cls._REGISTRY.keys())
    
    @classmethod
    def get_module(cls, key: str) -> Optional[ModuleDefinition]:
        cls.load()
        return cls._REGISTRY.get(key)
