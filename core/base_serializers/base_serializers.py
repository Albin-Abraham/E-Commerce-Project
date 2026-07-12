# core/base_serializers/base_serializers.py
from rest_framework import serializers
from core.base_serializers.dynamic_fields import DynamicFieldsMixin, ContextSerializerMixin
from core.base_serializers.validator_serializer import ValidatorSerializerMixin


class BaseModelSerializer(
    DynamicFieldsMixin,
    ContextSerializerMixin,
    ValidatorSerializerMixin,
    serializers.ModelSerializer,
):
    """
    Base ModelSerializer that includes GoF Domain Validation patterns,
    dynamic field tailoring, and recursive context propagation.
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        from core.admin.helpers.rule_selector import RuleSelector
        self._selector = RuleSelector(self.Meta.model, context=self.context)
        self._apply_model_rules()

    @property
    def _selector_trace(self):
        selector = getattr(self, "_selector", None)
        return selector.trace_log if selector else []

    def _apply_model_rules(self):
        """
        GoF Selector Pattern: Introspect model rules to set field attributes.
        Industrialized: Also injects rules into help_text for OpenAPI/Swagger observability.
        """
        if not hasattr(self.Meta, "model") or not hasattr(self, "_selector"):
            return

        selector = self._selector
        mode = self.context.get("validation_mode")
        
        # Get all raw rules for high-fidelity observability
        all_field_rules = selector.get_field_rules(self.Meta.model)

        for field_name, field in self.fields.items():
            active_rules = []
            
            # 1. Check Requirement
            if selector.is_required(field_name, context=mode):
                field.required = True
                field.allow_null = False
                active_rules.append("Required")
            
            # 2. Check Min Length
            min_len = selector.get_min_length(field_name)
            if min_len is not None and hasattr(field, "min_length"):
                field.min_length = min_len
                active_rules.append(f"MinLength({min_len})")

            # 3. Inject Rules into Help Text (Observability)
            if active_rules:
                rule_hint = f" [Rules: {', '.join(active_rules)}]"
                existing_help = getattr(field, "help_text", "") or ""
                if rule_hint not in existing_help:
                    field.help_text = f"{existing_help}{rule_hint}".strip()
    def create(self, validated_data):
        """
        Industrialized Creation:
        1. Context Injection: Auto-populates tenant if missing (Respects SuperAdmin overrides).
        2. Mediator Orchestration: Unlocks model for save.
        """
        from core.admin.helpers.mediator_helpers import ValidationMediator
        model_class = self.Meta.model
        request = self.context.get("request")
        
        # --- Context Injection ---
        if request and hasattr(request, "user"):
            user = request.user
            is_super = getattr(user, "is_superuser", False) or getattr(user, "is_staff", False)
            
            # Auto-inject company ONLY if it's missing from the payload
            # (SuperAdmins can pass a specific company ID in the payload)
            if "company" not in validated_data and hasattr(model_class, "company"):
                user_company = getattr(user, "company", None)
                if user_company:
                    validated_data["company"] = user_company
        
        mediator = ValidationMediator(model_class)
        validated_data, instance = mediator.validate(
            validated_data, 
            context=self.context
        )
        
        instance.save()
        return instance

    def update(self, instance, validated_data):
        """
        Industrialized Update:
        1. Immutability Guard: Strips tenant fields unless user is SuperAdmin.
        2. Mediator Orchestration: Unlocks model for save.
        """
        from core.admin.helpers.mediator_helpers import ValidationMediator
        request = self.context.get("request")
        
        # --- Immutability Guard ---
        # Only SuperAdmins can move records between companies (Silo Protection)
        is_super = False
        if request and hasattr(request, "user"):
            is_super = getattr(request.user, "is_superuser", False) or getattr(request.user, "is_staff", False)
            
        if not is_super:
            validated_data.pop("company", None)
            validated_data.pop("business_unit", None)
            validated_data.pop("branch", None)
        
        mediator = ValidationMediator(self.Meta.model)
        validated_data, updated_instance = mediator.validate(
            validated_data, 
            instance=instance,
            partial=self.partial,
            context=self.context
        )
        
        updated_instance.save()
        return updated_instance

    def to_representation(self, instance):
        """
        Industrialized Representation:
        Automatically expands Foreign Keys into Smart Identity packages 
        for high-end frontend consumption.
        """
        data = super().to_representation(instance)
        
        # We only expand for GET requests (Retrieval)
        request = self.context.get("request")
        if request and request.method == "GET":
            for field_name, field in self.fields.items():
                if isinstance(field, serializers.PrimaryKeyRelatedField):
                    # Check if the instance has the related object loaded
                    obj = getattr(instance, field_name, None)
                    if obj and hasattr(obj, 'identity'):
                        # Expand to Identity Package
                        data[field_name] = obj.identity
        return data
