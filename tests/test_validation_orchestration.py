import pytest
from rest_framework import serializers
from core.admin.helpers.mediator_helpers import ValidationMediator
from core.base_models.exceptions import RuleViolation
from core.base_models.validators.rules import RequiredRule, BaseRule
from core.admin.models.company import Company
from core.admin.serializers.company_serializers import CompanySerializer

@pytest.mark.django_db
class TestValidationOrchestration:
    """
    Industrialized tests for the Unified Validation Engine.
    Covers RuleViolation mapping, Metadata Tracing, and Mediator Orchestration.
    """

    def test_rule_violation_exception(self):
        """Verify BaseRule raises RuleViolation instead of Django ValidationError."""
        rule = RequiredRule("name")
        company = Company(name="") # Invalid
        
        with pytest.raises(RuleViolation) as excinfo:
            rule.validate(company, "")
        
        assert excinfo.value.code == "required"
        assert excinfo.value.field_name == "name"

    def test_mediator_mapping_to_drf(self):
        """Verify ValidationMediator maps RuleViolation to DRF ValidationError."""
        mediator = ValidationMediator(Company)
        data = {
            "name": "", # Should trigger RequiredRule
            "code": "C123",
            "email": "john@example.com",
        }
        
        with pytest.raises(serializers.ValidationError) as excinfo:
            mediator.validate(data)
        
        # DRF error format should be a dict with field names as keys
        assert "name" in excinfo.value.detail
        assert excinfo.value.detail["name"][0] == "name is required."

    def test_validation_tracing_metadata(self):
        """Verify that 'explain' mode correctly injects validation traces."""
        mediator = ValidationMediator(Company)
        data = {
            "name": "John",
            "code": "C123",
            "email": "john@doe.com",
        }
        
        # Run with explain=True
        context = {"explain": True}
        validated_data, instance = mediator.validate(data, context=context)
        
        # Check if trace was captured
        assert hasattr(instance, "_selector_trace")
        trace = instance._selector_trace
        assert len(trace) > 0
        # Check for specific success messages
        assert any(msg["rule"] == "RequiredRule" and msg["field"] == "name" and msg["status"] == "success" for msg in trace)
        assert any(msg["rule"] == "EmailRule" and msg["field"] == "email" and msg["status"] == "success" for msg in trace)

    def test_serializer_integration_with_mediator(self):
        """Verify ValidatorSerializerMixin correctly invokes the mediator logic."""
        data = {
            "name": "Jane",
            "code": "C999",
            "email": "jane@smith.com",
        }
        
        # Serializer should trigger mediator in its validate() method
        serializer = CompanySerializer(data=data, context={"validation_mode": "create"})
        assert serializer.is_valid(), serializer.errors
        
        # Verify the proven_instance was built and unlocked
        assert hasattr(serializer, "_proven_instance")
        assert serializer._proven_instance._validated_by_mediator is True

    def test_conditional_rule_applies(self):
        """Verify that the 'applies' logic correctly skips rules when condition fails."""
        # Custom rule that only applies on 'UPDATE' mode
        class UpdateOnlyRule(BaseRule):
            def applies(self, instance, value, context=None):
                return context.get("mode") == "update"
            
            def check(self, instance):
                return False # Always fail if applied

        # 1. Test in 'CREATE' mode - should PASS (rule doesn't apply)
        rule = UpdateOnlyRule(error_message="Fail!")
        context = {"mode": "create"}
        company = Company()
        rule.validate(company, None, context) # Should not raise
        
        # 2. Test in 'UPDATE' mode - should FAIL (rule applies)
        context = {"mode": "update"}
        with pytest.raises(RuleViolation):
            rule.validate(company, None, context)
