import json
from rest_framework import serializers

class DynamicFieldsMixin:
    """
    Mixin for Serializers to allow dynamic field tailoring from query params.
    Supports '?fields=a,b,c' and '?fields=["a","b"]' syntax.
    """
    fields: dict[str, serializers.Field]
    context: dict

    def __init__(self, *args, **kwargs):
        # Don't pass 'fields' to the superclass
        fields = kwargs.pop('fields', None)
        
        super().__init__(*args, **kwargs)
        
        if fields:
            # Explicitly requested fields via kwargs
            self.apply_field_pruning(fields)
        elif 'request' in self.context:
            # Dynamically requested fields via query params
            params = self.context['request'].query_params
            fields_param = params.get('fields')
            if fields_param:
                self.apply_field_pruning(self.parse_fields_param(fields_param))

    def parse_fields_param(self, param):
        """Parse comma-separated or JSON list syntax."""
        if param.startswith('[') and param.endswith(']'):
            try:
                return json.loads(param)
            except ValueError:
                return [f.strip() for f in param[1:-1].split(',')]
        return [f.strip() for f in param.split(',')]

    def apply_field_pruning(self, allowed_fields):
        """Prune fields that are not in the allowed list."""
        existing = set(self.fields.keys())
        allowed = set(allowed_fields)
        for field_name in existing - allowed:
            self.fields.pop(field_name)


class ContextSerializerMixin:
    """
    Ensures context is propagated to all child serializers.
    """
    context: dict

    def __getattribute__(self, name):
        """
        Intersept field access to inject context into nested serializers 
        if we are accessing a field that is itself a serializer.
        """
        attr = super().__getattribute__(name)
        if name == 'fields' and isinstance(attr, dict):
            # Ensure all child serializers have the parent's context
            for field in attr.values():
                if hasattr(field, 'context') and isinstance(field.context, dict) and not field.context:
                    field.context.update(self.context)
        return attr
