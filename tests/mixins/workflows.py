# tests/mixins/workflows.py
from tests.factories.company import CompanyFactory
from tests.factories.subscription import SubscriptionFactory

class OrganizationWorkflowMixin:
    """Modular workflow steps for Organization (Company)."""

    def create_org_with_subscription(self, org_overrides=None, sub_overrides=None):
        """Creates a Subscription and then a Company attached to it."""
        sub = SubscriptionFactory.create(**(sub_overrides or {}))
        org = CompanyFactory.create(subscription=sub, **(org_overrides or {}))
        return org, sub
