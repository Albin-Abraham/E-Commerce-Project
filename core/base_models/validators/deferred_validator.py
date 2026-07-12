# core/validators/deferred_validator.py (Pure Python)

class DeferredValidatorClass:
    """
    Registry and runner for deferred validation rules.
    """
    _registry = {}  # Format: { ModelClass: [RuleInstance, ...] }

    @classmethod
    def register(cls, model_class, rules):
        """
        Register a list of rules for a specific model class.
        """
        if model_class not in cls._registry:
            cls._registry[model_class] = []
        
        if isinstance(rules, list):
            cls._registry[model_class].extend(rules)
        else:
            cls._registry[model_class].append(rules)

    @classmethod
    def run_validation(cls, instance):
        """
        Run all registered rules for the instance's class and its parents.
        """
        errors = []
        model_class = type(instance)
        
        # Traverse MRO to include inherited rules
        for base in model_class.__mro__:
            rules = cls._registry.get(base, [])
            for rule in rules:
                try:
                    is_valid = rule.check(instance)
                    if not is_valid:
                        error_data = {
                            'message': rule.error_message,
                            'code': rule.error_code
                        }
                        if hasattr(rule, 'field_name'):
                            error_data['field'] = rule.field_name
                        errors.append(error_data)
                except Exception as e:
                    errors.append({
                        'message': f"Rule execution failed: {str(e)}",
                        'code': 'rule_error'
                    })

        return errors
