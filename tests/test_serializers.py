# tests/test_serializers.py
import pytest
from core.admin.serializers.company_serializers import CompanySerializer
from tests.factories.company import CompanyFactory

@pytest.mark.django_db
class TestSmartSerializers:
    """Tests for BaseModelSerializer rule induction."""

    def test_company_serializer_induces_required_rules(self):
        """Verify that mandatory model fields are required in the serializer."""
        serializer = CompanySerializer()
        
        # 'name', 'email', 'code' have RequiredRule in Company model
        assert serializer.fields['name'].required is True
        assert serializer.fields['email'].required is True
        assert serializer.fields['code'].required is True
        
        # 'subscription' is nullable/optional in model (null=True, blank=True)
        assert serializer.fields['subscription'].required is False

    def test_company_serializer_induces_min_length_rules(self):
        """Verify that MinRule from model is applied to serializer fields."""
        serializer = CompanySerializer()
        
        # 'name' has MinRule(3)
        assert serializer.fields['name'].min_length == 3

    def test_serializer_validation_trigger_model_rules(self):
        """Verify that serializer.is_valid() catches model-level rule violations."""
        # 'name' too short (MinRule)
        data = {
            "name": "Ab", 
            "email": "test@example.com", 
            "code": "TEST1"
        }
        serializer = CompanySerializer(data=data)
        assert serializer.is_valid() is False
        assert 'name' in serializer.errors
        # The error might come from DRF's min_length or our custom Rule engine.
        # Either way, the "Smart" part is that the constraint was induced.
