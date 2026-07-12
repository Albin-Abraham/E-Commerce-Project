# tests/test_api_process.py
import pytest
from django.urls import reverse
from tests.base import BaseTest
from tests.mixins.api import APITestMixin
from tests.mixins.creation import CreationMixin
from tests.factories.company import CompanyFactory
from tests.factories.user import UserFactory

@pytest.mark.django_db
class TestAPIProcess(BaseTest, APITestMixin, CreationMixin):
    """Integration tests for Company API lifecycle."""

    def test_create_company_via_api_induces_extension(self):
        """Verify that creating a company via API correctly creates the CompanyExtension."""
        user = UserFactory()
        self.authenticate(user)
        
        url = reverse("company-list")
        data = {
            "name": "Global Tech",
            "email": "info@globaltech.com",
            "code": "GTECH",
            "extensions": {
                "extra_attributes": {"industry": "IT"}
            }
        }
        
        response = self.post_api(url, data)
        assert response.status_code == 201
        
        from core.admin.models.company import Company, CompanyExtension
        company = Company.objects.get(name="Global Tech")
        extension = CompanyExtension.objects.get(company=company)
        assert extension.extra_attributes == {"industry": "IT"}

    def test_serializer_induced_min_length_via_api(self):
        """Verify that induced min_length rule triggers 422 error in API."""
        user = UserFactory()
        self.authenticate(user)
        
        url = reverse("company-list")
        # 'name' MinRule(3)
        data = {
            "name": "Hi", 
            "email": "hi@test.com", 
            "code": "HI1"
        }
        response = self.post_api(url, data)
        assert response.status_code == 422
        assert "name" in response.data["details"]["errors"]
