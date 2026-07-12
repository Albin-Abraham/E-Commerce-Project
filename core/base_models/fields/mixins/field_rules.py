# core/base_models/fields/mixins/field_rules.py

class RulesFieldMixin:
    """
    Mixin for custom fields to support fluent validation rules.
    Allows passing 'rules=[...]' during field definition.
    """
    def __init__(self, *args, rules=None, conditions=None, **kwargs):
        self.rules = rules or []
        self.conditions = conditions or [] # Field-level conditions (when to show/validate)
        super().__init__(*args, **kwargs)

    def contribute_to_class(self, cls, name, private_only=False):
        super().contribute_to_class(cls, name, private_only=private_only)
        
        # Ensure the model has its OWN validation_rules list (not inherited)
        if 'validation_rules' not in cls.__dict__:
            # If a parent has it, we might want to extend it or start fresh.
            # Usually, rules are per-model.
            cls.validation_rules = list(getattr(cls, 'validation_rules', []))
            
        # Attach our rules to the model's validation registry
        # We need to make sure we don't duplicate rules if contribute_to_class reaches here multiple times
        for rule in self.rules:
            # Auto-assign field_name if not already set
            if hasattr(rule, 'field_name') and not getattr(rule, 'field_name', None):
                rule.field_name = name
            
            # Wrap in conditional if field has conditions
            if self.conditions:
                from core.base_models.validators.rules import ConditionalWrapper
                for cond in self.conditions:
                    rule = ConditionalWrapper(rule, cond)
            
            if rule not in cls.validation_rules:
                cls.validation_rules.append(rule)
