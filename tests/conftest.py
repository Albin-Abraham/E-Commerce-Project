# tests/conftest.py
import pytest
from core.admin.models.company import Company
from core.admin.models.subscriptions import Subscription

@pytest.fixture
def company(db):
    from tests.factories.company import CompanyFactory
    return CompanyFactory()

@pytest.fixture
def user(db):
    from tests.factories.user import UserFactory
    return UserFactory()

@pytest.fixture
def subscription(db):
    from tests.factories.subscription import SubscriptionFactory
    return SubscriptionFactory()

@pytest.fixture(autouse=True)
def bypass_validation_guard():
    """
    Industrialized Test Bypass:
    Automatically bypasses the ValidationGuardMixin during automated tests
    so that FactoryBoy and generic scripts can save models directly without needing the Mediator.
    """
    from core.base_models.validator_model import bypass_mediator_guard
    with bypass_mediator_guard():
        yield
