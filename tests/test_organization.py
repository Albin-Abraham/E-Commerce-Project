# tests/test_organization.py
import pytest
from tests.base import BaseTest
from tests.mixins.creation import CreationMixin
from tests.mixins.validation import ValidationMixin
from tests.mixins.assertions import AssertionMixin
from tests.mixins.workflows import OrganizationWorkflowMixin
from tests.factories.company import CompanyFactory

@pytest.mark.django_db
class TestOrganization(
    BaseTest,
    CreationMixin,
    ValidationMixin,
    AssertionMixin,
    OrganizationWorkflowMixin,
):
    factory_class = CompanyFactory

    def test_can_create_valid_organization(self):
        """Test creating a valid organization via factory and mixins."""
        org = self.create(name="Acme Corp", email="acme@test.com")
        self.assert_valid(org)
        self.assert_field(org, "name", "Acme Corp")
        self.assert_field(org, "email", "acme@test.com")

    def test_invalid_organization_missing_name(self):
        """Test that an organization without a name is invalid."""
        org = self.build(name="")
        self.assert_invalid(org, field="name")

    def test_workflow_org_with_subscription(self):
        """Test the modular workflow for creating org with subscription."""
        org, sub = self.create_org_with_subscription(
            org_overrides={"name": "CloudNine"},
            sub_overrides={"name": "Premium Plan"}
        )
        self.assert_valid(org)
        self.assert_valid(sub)
        self.assert_field(org, "subscription", sub)
        self.assert_field(sub, "name", "Premium Plan")
