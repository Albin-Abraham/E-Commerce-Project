import pytest
from tests.base import BaseTest
from tests.mixins.creation import CreationMixin
from tests.mixins.validation import ValidationMixin
from tests.mixins.assertions import AssertionMixin
from tests.factories.user import UserFactory

@pytest.mark.django_db
class TestUserModelFields(
    BaseTest, 
    CreationMixin, 
    ValidationMixin, 
    AssertionMixin
):
    factory_class = UserFactory

    def test_can_create_valid_user(self):
        """Test user creation with factory."""
        user = self.create(email="test@example.com", username="testuser")
        
        self.assert_valid(user)
        self.assert_field(user, "email", "test@example.com")
        self.assert_field(user, "username", "testuser")
        self.assert_field(user, "is_active", True)
        
    def test_email_validation(self):
        """Test email validation failure."""
        user = self.build(email="invalid-email")
        self.assert_invalid(user)

    def test_username_max_length(self):
        """Test username max length."""
        long_username = "a" * 151
        user = self.build(username=long_username)
        self.assert_invalid(user)
