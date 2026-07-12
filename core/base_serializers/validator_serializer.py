# core/base_serializers/validator_serializer.py
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

class ValidatorSerializerMixin:
    """
    Mixin for ModelSerializers to call orchestrated domain validation.
    """
    def validate(self, attrs):
        from core.admin.helpers.mediator_helpers import ValidationMediator

        attrs = super().validate(attrs)
        
        # Pull validation mode from context (passed by BaseAPIView)
        mode = self.context.get("validation_mode")
        request = self.context.get("request")
        user = getattr(request, "user", None) if request else None
        
        # Build rich context for GoF Strategy Rules
        rich_context = {
            "mode": mode,
            "user": user,
            "request": request
        }
        
        # GoF Mediator Pattern: Orchestrate validation
        mediator = ValidationMediator(self.Meta.model)
        validated_data, proven_instance = mediator.validate(
            data=attrs,
            instance=self.instance,
            partial=getattr(self, "partial", False),
            context=rich_context
        )
        
        # Store for the subsequent create/update call
        self._proven_instance = proven_instance
        return validated_data

    def create(self, validated_data):
        """Use the instance already built and validated by the mediator."""
        instance = getattr(self, "_proven_instance", None)
        if instance:
            instance.save()
            return instance
        return super().create(validated_data)

    def update(self, instance, validated_data):
        """Use the instance already built and validated by the mediator."""
        proven_instance = getattr(self, "_proven_instance", None)
        if proven_instance:
            proven_instance.save()
            return proven_instance
        return super().update(instance, validated_data)
