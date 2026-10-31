from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.procurement_pos.models.procurement import Supplier
from apps.procurement_pos.services.vendor_registration_service import VendorRegistrationService

User = get_user_model()


class VendorRegistrationTestCase(TestCase):
    """
    Test suite for Dedicated Vendor & Supplier Self-Service Onboarding.
    """

    def setUp(self):
        self.client = APIClient()

    def test_vendor_registration_service_success(self):
        user, supplier = VendorRegistrationService.register_vendor(
            company_name="Apex Electronics Ltd",
            representative_name="Marcus Vance",
            email="marcus@apexelectronics.com",
            password="VendorSecurePassword123!",
            tax_id="VAT-JP-99881122",
            phone="+81 3-5555-8899",
            category="MANUFACTURER",
        )

        self.assertEqual(user.username, "marcus")
        self.assertEqual(user.email, "marcus@apexelectronics.com")
        self.assertEqual(user.profile.user_type, "PARTNER_B2B")
        self.assertTrue(user.profile.is_partner)

        self.assertEqual(supplier.name, "Apex Electronics Ltd")
        self.assertTrue(supplier.code.startswith("SUP-"))
        self.assertEqual(supplier.contact_person, "Marcus Vance")
        self.assertEqual(supplier.tax_id, "VAT-JP-99881122")
        self.assertEqual(supplier.metadata.get("category"), "MANUFACTURER")
        self.assertEqual(supplier.party, user)

    def test_vendor_registration_duplicate_rejection(self):
        VendorRegistrationService.register_vendor(
            company_name="Global Trade Corp",
            representative_name="John Doe",
            email="john@globaltrade.com",
            password="Password123!",
        )

        with self.assertRaises(ValueError) as ctx:
            VendorRegistrationService.register_vendor(
                company_name="Global Trade Corp",
                representative_name="Jane Doe",
                email="jane@globaltrade.com",
                password="Password123!",
            )
        self.assertIn("already exists", str(ctx.exception))

    def test_vendor_registration_api_endpoint(self):
        payload = {
            "company_name": "Zenith Semiconductor Corp",
            "representative_name": "Kenji Sato",
            "email": "kenji@zenithsemi.com",
            "username": "kenji_semi",
            "password": "KenjiPassword123!",
            "tax_id": "JP-TAX-44332211",
            "phone": "+81 6-4444-1234",
            "category": "DISTRIBUTOR",
        }

        response = self.client.post("/api/v1/procurement/suppliers/register/", data=payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("supplier_code", response.data["data"])
        self.assertEqual(response.data["data"]["company_name"], "Zenith Semiconductor Corp")
        self.assertTrue(Supplier.objects.filter(name="Zenith Semiconductor Corp").exists())
