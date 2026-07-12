from apps.users.models.users import UserModel
import pytest
from django.test import TestCase
from core.base_models.validators.rules import PasswordValidatorRule
from rest_framework.exceptions import ValidationError
from apps.users.services.auth_service import AuthService

@pytest.mark.feature
@pytest.mark.module
@pytest.mark.django_db
@pytest.mark.system
class TestRegistrationFlow:
    """
    Tests for User Registration Flow using AuthService and ValidationMediator.
    """

    def test_password_validator_rule(self):
        """Test the PasswordValidatorRule directly."""
        rule = PasswordValidatorRule()
        
        # Valid password
        user = UserModel(password="ProperPass123!@#")
        assert rule.check(user) is True

        # Common password (should fail NumericPasswordValidator or CommonPasswordValidator)
        user = UserModel(password="password123")
        assert rule.check(user) is False
        assert "common" in rule.error_message.lower() or "numeric" in rule.error_message.lower()

    def test_auth_service_registration_success(self):
        """Test successful registration via AuthService."""
        data = {
            "email": "new_user@example.com",
            "username": "new_user",
            "password": "ComplexPassword123!",
            "full_name": "New User"
        }
        user = AuthService.register_user(data)
        assert user.email == data["email"]
        assert user.username == data["username"]
        assert user.check_password(data["password"])
        assert user.full_name == "New User"

    def test_auth_service_registration_validation_error(self):
        """Test that ValidationMediator catches errors in AuthService."""
        # Short password
        data = {
            "email": "invalid@example.com",
            "username": "invalid_user",
            "password": "short"
        }
        with pytest.raises(ValidationError) as excinfo:
            AuthService.register_user(data)
        
        assert "password" in excinfo.value.detail
        assert "short" in str(excinfo.value.detail["password"]).lower()

    def test_duplicate_email_registration(self):
        """Test that UniqueRule for email is enforced."""
        data = {
            "email": "duplicate@example.com",
            "username": "user1",
            "password": "ComplexPassword123!"
        }
        AuthService.register_user(data)
        
        data["username"] = "user2" # Different username, same email
        with pytest.raises(ValidationError) as excinfo:
            AuthService.register_user(data)
        
        assert "email" in excinfo.value.detail
