from typing import Any, Optional, Type, Dict, List
from django.db.models import Model
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from .builder_helpers import ModelInstanceBuilder


class ValidationMediator:
    """
    GoF Mediator Pattern: Orchestrates validation between serializers and models.
    """
    def __init__(self, model_class: Type[Model]):
        self.model_class = model_class

    def validate(
        self, 
        data: dict, 
        instance: Optional[Model] = None, 
        partial: bool = False, 
        context: Optional[dict] = None
    ) -> tuple[dict, Model]:
        """
        Orchestrate rule execution with support for custom exceptions and tracing.
        """
        context = context or {}
        
        # Metadata Injection: Initialize trace if 'explain' mode is active
        trace = [] if context.get("explain") else None
        context["_trace"] = trace

        # 1. Build temporary instance
        builder = ModelInstanceBuilder(self.model_class, instance)
        built_instance = builder.build(data, partial)

        # 2. Extract rules
        from core.base_models.validator_model import ValidatorModelMixin
        rules_dict: Dict[str, List[Any]] = {}
        if isinstance(built_instance, ValidatorModelMixin):
            rules_dict = built_instance._rules
        
        errors = {}
        
        # 3. Execute Rules
        from core.base_models.exceptions import RuleViolation
        import logging
        logger = logging.getLogger("core.mediator")

        for field, rules in rules_dict.items():
            value = getattr(built_instance, field, None)
            for rule in rules:
                rule_name = rule.__class__.__name__
                if trace is not None:
                    trace.append({
                        "field": field,
                        "rule": rule_name,
                        "status": "pending",
                        "metadata": getattr(rule, "metadata", {})
                    })

                if rule.applies(built_instance, value, context):
                    try:
                        rule.validate(built_instance, value, context)
                        if trace is not None:
                            trace[-1]["status"] = "success"
                    except RuleViolation as e:
                        if trace is not None:
                            trace[-1]["status"] = "failed"
                            trace[-1]["error"] = e.message
                        
                        if field not in errors:
                            errors[field] = []
                        errors[field].append(e.message)
                    except (serializers.ValidationError, DjangoValidationError) as e:
                        if trace is not None:
                            trace[-1]["status"] = "failed"
                        
                        if field not in errors:
                            errors[field] = []
                        
                        if hasattr(e, "detail"):
                            msg = e.detail
                            if isinstance(msg, list): errors[field].extend(msg)
                            else: errors[field].append(msg)
                        elif hasattr(e, "messages"):
                            errors[field].extend(e.messages)
                        else:
                            errors[field].append(str(e))
                elif trace is not None:
                    trace[-1]["status"] = "skipped"
                    trace[-1]["reason"] = "Applicability check failed"
        
        if errors:
            raise serializers.ValidationError(errors)

        # Unlock the instance
        if hasattr(built_instance, "_validated_by_mediator"):
            built_instance._validated_by_mediator = True
            # Pass the trace back to the instance for serializer exposure
            if trace:
                built_instance._selector_trace = trace

        return data, built_instance
