import pytest
from django.db.utils import IntegrityError
from core.admin.models.company import Company, CompanyExtension
from core.admin.models.subscriptions import Subscription

from tests.base import BaseTest
from tests.mixins.core_mixins import CreationMixin, ValidationMixin, AssertionMixin
from tests.factories.admin_factories import CompanyFactory, SubscriptionFactory

@pytest.mark.django_db
class TestCompanyModel(BaseTest, CreationMixin, ValidationMixin, AssertionMixin):
    factory_class = CompanyFactory

    def test_create_company(self):
        """Test creating a valid company using factory."""
        company = self.create(name="Test Company", code="TESTCOMP")
        self.assert_valid(company)
        self.assert_field(company, "name", "Test Company")
        self.assert_field(company, "code", "TESTCOMP")
        assert company.created_at is not None
        assert str(company) == "Test Company (TESTCOMP)"

    def test_unique_name_constraint(self):
        """Test that company names must be unique (IntegrityError)."""
        self.create(name="Unique Co")
        with pytest.raises(IntegrityError):
            self.create(name="Unique Co")

    def test_company_without_subscription(self):
        """Test creating a company without a subscription."""
        company = self.create(subscription=None)
        assert company.subscription is None

    def test_company_extension_relationship(self):
        """Test one-to-one relationship with CompanyExtension."""
        company = self.create()
        from core.base_models.validator_model import bypass_mediator_guard
        with bypass_mediator_guard():
            extension = CompanyExtension.objects.create(
                company=company,
                extra_attributes={"custom": "value"}
            )
        assert company.extensions == extension
        self.assert_json_attr(extension, "extra_attributes", "custom", "value")
