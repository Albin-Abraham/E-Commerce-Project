from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from core.admin.models.company import Company
from core.admin.models.branch import Branch
from apps.users.models.users import UserModel

@override_settings(BYPASS_VALIDATION_GUARD=True)
class TenantAPITest(APITestCase):
    def setUp(self):
        # Create a superuser for admin actions
        self.admin_user = UserModel.objects.create_superuser(
            email="admin@enterprise.com",
            username="admin",
            password="password123",
            full_name="Admin User"
        )
        self.client.force_authenticate(user=self.admin_user)

    def test_company_crud(self):
        """
        Verify Company CRUD operations via REST API.
        """
        url = reverse("company-list")
        
        # 1. Create Company
        data = {
            "name": "Global Corp",
            "email": "info@globalcorp.com",
            "code": "GC001"
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["success"])
        company_id = response.data["data"]["id"]
        
        # 2. List Companies (Handle Pagination)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results") or response.data.get("data")
        self.assertTrue(any(c["id"] == company_id for c in results))

        # 3. Update Company (PATCH)
        detail_url = reverse("company-detail", kwargs={"pk": company_id})
        response = self.client.patch(detail_url, {"name": "Global Corp Updated"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["name"], "Global Corp Updated")

    def test_branch_crud_with_scoping(self):
        """
        Verify Branch CRUD and its scoping to Company.
        """
        # Create a company first
        company = Company.objects.create(
            name="Alpha Industries",
            email="contact@alpha.com",
            code="ALPHA"
        )
        
        from core.admin.models.business_unit import BusinessUnit
        bu = BusinessUnit.objects.create(name="Alpha BU", company=company)
        
        url = reverse("branch-list")
        
        # 1. Create Branch
        data = {
            "company": company.id,
            "business_unit": bu.id,
            "name": "Research Branch",
            "code": "RB01",
            "location": "Sector 7",
            "opened_date": "2026-01-01"
        }
        response = self.client.post(url, data)
        if response.status_code != status.HTTP_201_CREATED:
            print(response.data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        branch_id = response.data["data"]["id"]
        
        # 2. Get Branch Detail
        detail_url = reverse("branch-detail", kwargs={"pk": branch_id})
        response = self.client.get(detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["name"], "Research Branch")

    def test_domain_validation_via_api(self):
        """
        Verify that model rules are enforced by the serializer during POST.
        """
        url = reverse("company-list")
        
        # Name too short (MinRule is 3 chars)
        data = {
            "name": "Ab", 
            "email": "test@test.com",
            "code": "TEST1"
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        self.assertIn("name", response.data["details"]["errors"])
