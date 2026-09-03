from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from apps.customers.models.customer import Customer, CustomerAddress, CustomerPreference, SocialAccount
from apps.customers.services.registration_service import CustomerRegistrationService
from apps.customers.services.oauth_service import SocialOAuthAuthService
from core.base_models.system_models import SystemConfig, Company

User = get_user_model()


class CustomerRegistrationTDDTestCase(TestCase):
    """
    Test-Driven Development (TDD) Test Suite for Customer & Portal User Registration,
    Validation Rules, B2B Commercial Onboarding, Social OAuth SSO, and REST API Endpoints.
    """

    def setUp(self):
        self.client = APIClient()
        SystemConfig.objects.create(key="GOOGLE_STORAGE_BUCKET_NAME", value="yafei-platform-avatars")
        SystemConfig.objects.create(key="GOOGLE_API_KEY", value="AIzaSyTestApiKey12345")
        self.company = Company.objects.create(name="Acme Corp", code="ACME-01")

    # -------------------------------------------------------------------------
    # 1. B2C Retail Customer Registration Tests
    # -------------------------------------------------------------------------
    def test_b2c_individual_customer_registration_success(self):
        """TDD: Verifies successful registration of a B2C retail individual customer."""
        user, customer = CustomerRegistrationService.register_customer(
            username="alice_b2c",
            email="alice@example.com",
            password="StrongPassword123!",
            full_name="Alice Walker",
            customer_type="INDIVIDUAL",
            phone="+19876543210",
            address_data={
                "title": "Home",
                "address_line_1": "100 Broadway St",
                "city": "New York",
                "state": "NY",
                "postal_code": "10005",
                "pincode": "10005",
            },
        )

        self.assertEqual(user.username, "alice_b2c")
        self.assertEqual(user.email, "alice@example.com")
        self.assertEqual(customer.name, "Alice Walker")
        self.assertEqual(customer.customer_type, "INDIVIDUAL")
        self.assertTrue(customer.customer_code.startswith("CUST-"))
        self.assertEqual(customer.address_lines.count(), 1)
        self.assertEqual(customer.address_lines.first().pincode, "10005")

        # Preference verification
        self.assertTrue(hasattr(customer, "preferences"))
        self.assertEqual(customer.preferences.preferred_language, "en")
        self.assertTrue(customer.preferences.sms_notifications)

    # -------------------------------------------------------------------------
    # 2. B2B Commercial Corporate Buyer Registration Tests
    # -------------------------------------------------------------------------
    def test_b2b_commercial_customer_registration_with_tax_id(self):
        """TDD: Verifies registration of a B2B commercial business buyer with Tax ID."""
        user, customer = CustomerRegistrationService.register_customer(
            username="b2b_corp_buyer",
            email="procurement@corptech.com",
            password="CorporatePassword456!",
            full_name="CorpTech Logistics LLC",
            customer_type="COMMERCIAL",
            phone="+18005550199",
            tax_id="US-TAX-99887766",
            company_id=self.company.id,
        )

        self.assertEqual(customer.customer_type, "COMMERCIAL")
        self.assertEqual(customer.tax_id, "US-TAX-99887766")
        self.assertEqual(customer.company.id, self.company.id)
        self.assertTrue(customer.is_active)

    # -------------------------------------------------------------------------
    # 3. Registration Error & Validation Tests (Red -> Green)
    # -------------------------------------------------------------------------
    def test_registration_rejects_duplicate_username(self):
        """TDD: Ensures duplicate username registration raises a clear ValueError."""
        CustomerRegistrationService.register_customer(
            username="unique_user",
            email="user1@example.com",
            password="Password123!",
            full_name="User One",
        )

        with self.assertRaises(ValueError) as ctx:
            CustomerRegistrationService.register_customer(
                username="unique_user",
                email="user2@example.com",
                password="Password123!",
                full_name="User Two",
            )
        self.assertIn("Username 'unique_user' is already taken", str(ctx.exception))

    def test_registration_rejects_duplicate_email(self):
        """TDD: Ensures duplicate email registration raises a clear ValueError."""
        CustomerRegistrationService.register_customer(
            username="user_alpha",
            email="shared_email@example.com",
            password="Password123!",
            full_name="Alpha User",
        )

        with self.assertRaises(ValueError) as ctx:
            CustomerRegistrationService.register_customer(
                username="user_beta",
                email="shared_email@example.com",
                password="Password123!",
                full_name="Beta User",
            )
        self.assertIn("Email 'shared_email@example.com' is already registered", str(ctx.exception))

    # -------------------------------------------------------------------------
    # 4. Social OAuth Registration & Identity Linking Tests
    # -------------------------------------------------------------------------
    def test_social_oauth_new_user_registration(self):
        """TDD: Verifies Google/GitHub OAuth sign-up creates User + Customer + SocialAccount."""
        user, customer, social_acc, created = SocialOAuthAuthService.authenticate_or_register_social_user(
            provider="GOOGLE",
            provider_uid="google_id_102030",
            email="social_new@example.com",
            full_name="Social Newbie",
            avatar_url="https://lh3.googleusercontent.com/avatar.jpg",
        )

        self.assertTrue(created)
        self.assertEqual(social_acc.provider, "GOOGLE")
        self.assertEqual(social_acc.uid, "google_id_102030")
        self.assertIn("https://storage.googleapis.com", social_acc.avatar_url)
        self.assertEqual(customer.email, "social_new@example.com")

    def test_social_oauth_auto_links_existing_user_by_email(self):
        """TDD: Verifies OAuth sign-in automatically attaches new provider link to an existing user with matching email."""
        # 1. First register via password
        existing_user, existing_customer = CustomerRegistrationService.register_customer(
            username="regular_user",
            email="common@example.com",
            password="Password123!",
            full_name="Common User",
        )

        # 2. Login via GitHub OAuth with same email
        user, customer, social_acc, created = SocialOAuthAuthService.authenticate_or_register_social_user(
            provider="GITHUB",
            provider_uid="github_uid_445566",
            email="common@example.com",
            full_name="Common User GitHub",
        )

        self.assertFalse(created)
        self.assertEqual(user.id, existing_user.id)
        self.assertEqual(customer.id, existing_customer.id)
        self.assertEqual(user.social_accounts.count(), 1)
        self.assertEqual(social_acc.provider, "GITHUB")

    # -------------------------------------------------------------------------
    # 5. REST API Registration & Social Login Endpoints (/api/v1/customers/)
    # -------------------------------------------------------------------------
    def test_api_register_customer_endpoint(self):
        """TDD: Tests DRF REST POST /api/v1/customers/register/ endpoint."""
        payload = {
            "username": "api_customer",
            "email": "api_cust@example.com",
            "password": "ApiPassword123!",
            "full_name": "API Customer",
            "customer_type": "INDIVIDUAL",
            "phone": "+14155552671",
            "address": {
                "address_line_1": "1 Market St",
                "city": "San Francisco",
                "postal_code": "94105",
                "pincode": "94105",
            },
        }

        response = self.client.post("/api/v1/customers/register/", data=payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("user_id", response.data)
        self.assertEqual(response.data["username"], "api_customer")
        self.assertTrue(response.data["customer"]["customer_code"].startswith("CUST-"))

    def test_api_social_login_endpoint(self):
        """TDD: Tests DRF REST POST /api/v1/customers/social-login/ endpoint."""
        payload = {
            "provider": "GOOGLE",
            "provider_uid": "google_api_uid_99",
            "email": "google_api@example.com",
            "full_name": "Google API User",
            "avatar_url": "https://lh3.googleusercontent.com/pic.jpg",
        }

        response = self.client.post("/api/v1/customers/social-login/", data=payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["provider"], "GOOGLE")
        self.assertEqual(response.data["email"], "google_api@example.com")
        self.assertTrue(response.data["is_new_user"])
