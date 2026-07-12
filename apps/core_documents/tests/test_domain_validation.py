from django.test import TestCase
from rest_framework import serializers
from core.base_serializers.base_serializers import BaseModelSerializer
from core.admin.rules import Rule, RequiredRule, ValidationMode
from django.db import models
from django.core.exceptions import ValidationError as DjangoValidationError


# 1. Mocked Rule for Testing
class ConditionalRequirementRule(Rule):
    def applies(self, instance, value, context):
        # Handle both string (legacy) and dict (new) context
        if isinstance(context, dict):
            mode = context.get("mode") or context.get("validation_mode")
        else:
            mode = context
        return mode == "submit"

    def validate(self, instance, value, context):
        if not value:
            raise DjangoValidationError("Field is required on submit.")


from core.base_models.validator_model import ValidatorModelMixin


# 2. Mocked Model for Testing
class ValidationTestModel(ValidatorModelMixin, models.Model):
    name = models.CharField(max_length=100, blank=True, null=True)
    status = models.CharField(max_length=20, default="draft")

    # GoF Strategy Pattern: Rules Engine
    _rules = {
        "name": [ConditionalRequirementRule(), RequiredRule()]
    }

    class Meta:
        managed = False  # Avoid DB table creation
        app_label = "core_documents"


# 3. Serializer using the Framework
class ValidationTestSerializer(BaseModelSerializer):
    class Meta:
        model = ValidationTestModel
        fields = ["name", "status"]


class DomainValidationTest(TestCase):
    def test_selector_pattern_required_introspection(self):
        """
        Verify RuleSelector correctly identifies requirement based on context.
        """
        # In DRAFT mode, name is NOT required (RequiredRule skips draft)
        serializer_draft = ValidationTestSerializer(context={"validation_mode": "draft"})
        self.assertFalse(serializer_draft.fields["name"].required)

        # In CREATE/SUBMIT mode, name IS required
        serializer_submit = ValidationTestSerializer(context={"validation_mode": "submit"})
        self.assertTrue(serializer_submit.fields["name"].required)

    def test_mediator_orchestration_context_validation(self):
        """
        Verify ValidationMediator correctly executes rules based on context.
        """
        # Valid data for DRAFT (name is empty)
        data = {"name": "", "status": "draft"}
        serializer = ValidationTestSerializer(data=data, context={"validation_mode": "draft"})
        self.assertTrue(serializer.is_valid())

        # Invalid data for SUBMIT (name is empty)
        serializer_submit = ValidationTestSerializer(data=data, context={"validation_mode": "submit"})
        self.assertFalse(serializer_submit.is_valid())
        self.assertIn("name", serializer_submit.errors)
        # Use str() to normalize ErrorDetail to string
        self.assertEqual(str(serializer_submit.errors["name"][0]), "Field is required on submit.")

    def test_builder_pattern_update(self):
        """
        Verify ModelInstanceBuilder correctly applies partial updates.
        """
        from core.admin.helpers import ModelInstanceBuilder
        instance = ValidationTestModel(name="Original", status="draft")
        builder = ModelInstanceBuilder(ValidationTestModel, instance)
        
        updated_instance = builder.build({"status": "active"}, partial=True)
        self.assertEqual(updated_instance.status, "active")
        self.assertEqual(updated_instance.name, "Original")
