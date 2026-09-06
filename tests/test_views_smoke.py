from django.contrib.auth import get_user_model
from rest_framework.test import APIClient, APITestCase

User = get_user_model()


class NoModelViewSmokeTests(APITestCase):
    """
    Guards against the CustomPermissionClass regressing on views that carry
    no resource model: profile and change-password must not be hard-blocked,
    and login/register must remain public.
    """

    def setUp(self):
        self.client = APIClient()
        self.password = "Password123!"
        self.user = User.objects.create_user(
            username="smoke_user",
            email="smoke@example.com",
            password=self.password,
        )

    def test_profile_view_not_blocked_when_authenticated(self):
        self.client.force_login(self.user)
        response = self.client.get("/api/auth/profile/")
        self.assertNotEqual(response.status_code, 403)
        self.assertIn(response.status_code, (200, 400))

    def test_change_password_view_not_blocked_when_authenticated(self):
        self.client.force_login(self.user)
        response = self.client.post(
            "/api/auth/change-password/",
            {
                "old_password": self.password,
                "new_password": "NewPassword456!",
            },
            format="json",
        )
        self.assertNotEqual(response.status_code, 403)
        self.assertIn(response.status_code, (200, 201, 400))

    def test_login_endpoint_public(self):
        response = self.client.post(
            "/api/auth/login/",
            {"username": "smoke_user", "password": self.password},
            format="json",
        )
        self.assertNotEqual(response.status_code, 403)

    def test_register_endpoint_public(self):
        response = self.client.post(
            "/api/auth/register/",
            {"username": "new_smoke_user", "email": "new_smoke@example.com", "password": "Password123!"},
            format="json",
        )
        self.assertNotEqual(response.status_code, 403)