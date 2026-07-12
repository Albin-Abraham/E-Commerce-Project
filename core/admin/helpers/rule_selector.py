from typing import Any, List, Type, Dict
from django.db.models import Model
from core.admin.helpers.cache_helpers import (
    get_metadata_cache_key,
    get_cached_metadata,
    set_cached_metadata
)


class RuleSelector:
    """
    GoF Selector Pattern: Dynamic introspection of model rules for serializers.
    Industrialized with Redis caching and architectural tracing.
    """
    def __init__(self, model_class: Type[Model], context: dict | None = None):
        from django.conf import settings
        self.model_class = model_class
        self.context = context or {}
        self.trace_log = []
        self._cache_enabled = getattr(settings, "METADATA_CACHE_ENABLED", True)

    def _log(self, message: str):
        """Append to trace log if context allows."""
        if self.context.get("explain"):
            self.trace_log.append(message)

    def get_field_rules(self, field_name: str) -> List[Any]:
        """
        Extract rules associated with a specific field on the model.
        Industrialized: Checks Redis cache before performing introspection.
        """
        model_name = self.model_class.__name__
        platform = self.context.get("platform", "default")
        
        # 1. Check Redis Cache
        cache_key = get_metadata_cache_key(model_name, context=platform)
        if self._cache_enabled:
            cached_data = get_cached_metadata(cache_key)
            if cached_data and field_name in cached_data:
                self._log(f"Cache Hit: Retrieved rules for {field_name} from Redis.")
                return cached_data[field_name]

        self._log(f"Cache Miss: Introspecting model {model_name} for field {field_name}.")
        
        # 2. Perform Introspection (Legacy logic)
        raw_rules = getattr(self.model_class, "validation_rules", [])
        field_rules = []
        for rule in raw_rules:
            if getattr(rule, "field_name", None) == field_name:
                field_rules.append(rule)
        
        if hasattr(self.model_class, "_rules"):
            cls_rules = getattr(self.model_class, "_rules", {})
            if isinstance(cls_rules, dict):
                for rule in cls_rules.get(field_name, []):
                    if rule not in field_rules:
                        field_rules.append(rule)
        
        if hasattr(self.model_class, "_meta"):
            for field in self.model_class._meta.fields:
                if field.name == field_name and hasattr(field, "rules"):
                    for rule in field.rules:
                        if rule not in field_rules:
                            field_rules.append(rule)
                
        return field_rules

    def is_required(self, field_name: str, context: Any = None) -> bool:
        """
        Check if a field is required under the current validation context.
        """
        rules = self.get_field_rules(field_name)
        
        # Normalize context to extract mode
        mode = context.get("mode") if isinstance(context, dict) else context
        
        for rule in rules:
            # Check for RequiredRule (new or legacy)
            if rule.__class__.__name__ == "RequiredRule":
                if hasattr(rule, "applies"):
                    # Pass the original context (dict or string) for flexibility
                    return rule.applies(None, None, context)
                return True
        return False

    def get_min_length(self, field_name: str) -> int | None:
        """
        Extract minimum length constraint if defined via MinRule.
        """
        rules = self.get_field_rules(field_name)
        for rule in rules:
            if rule.__class__.__name__ == "MinRule":
                if hasattr(rule, "min_val"):
                    return rule.min_val
                # Handle legacy MinRule which might have different attr name
                return getattr(rule, "min_val", None)
        return None
