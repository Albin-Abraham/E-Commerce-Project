# tests/security/test_tenant_isolation.py
import pytest
from django.test import TestCase

from apps.shop.infrastructure.models.product import Product
from core.admin.utils.context import ContextEngine, RequestContext
from core.security.tenant_isolation.exceptions import (
    TenantAccessViolationError,
    TenantContextMissingError,
)
from core.security.tenant_isolation.repository import TenantScopedRepository
from tests.base import BaseTest
from tests.factories.company import CompanyFactory
from tests.mixins.creation import CreationMixin


class TestTenantIsolationSecurity(BaseTest, CreationMixin, TestCase):
    """
    Dedicated Security Regression Suite:
    Verifies multi-tenant isolation, cross-tenant boundary defense,
    context-leak prevention, and repository scoping guarantees.
    """

    def setUp(self):
        super().setUp()
        RequestContext.clear()
        self.company_a = CompanyFactory.create(name="Alpha Corp", code="ALPH1")
        self.company_b = CompanyFactory.create(name="Beta Corp", code="BETA1")
        self.repo = TenantScopedRepository(Product)

    def tearDown(self):
        RequestContext.clear()
        super().tearDown()

    def test_missing_tenant_context_fails_safely(self):
        """Unestablished tenant context must reject queries immediately."""
        RequestContext.clear()
        with pytest.raises(TenantContextMissingError) as exc_info:
            self.repo.get_queryset()
        self.assertIn("tenant-scoped entity", exc_info.value.message)

    def test_tenant_scoped_query_isolation(self):
        """Company A must ONLY see Company A's entities, never Company B's."""
        # Create product for Company A
        with ContextEngine.run_as_tenant(company_id=self.company_a.id):
            prod_a = self.repo.create(sku="SKU-ALPHA-1", name="Alpha Widget", slug="alpha-widget")

        # Create product for Company B
        with ContextEngine.run_as_tenant(company_id=self.company_b.id):
            prod_b = self.repo.create(sku="SKU-BETA-1", name="Beta Gadget", slug="beta-gadget")

        # Query under Company A context
        with ContextEngine.run_as_tenant(company_id=self.company_a.id):
            qs_a = self.repo.get_queryset()
            self.assertEqual(qs_a.count(), 1)
            self.assertEqual(qs_a.first().id, prod_a.id)
            self.assertFalse(qs_a.filter(id=prod_b.id).exists())

        # Query under Company B context
        with ContextEngine.run_as_tenant(company_id=self.company_b.id):
            qs_b = self.repo.get_queryset()
            self.assertEqual(qs_b.count(), 1)
            self.assertEqual(qs_b.first().id, prod_b.id)
            self.assertFalse(qs_b.filter(id=prod_a.id).exists())

    def test_cross_tenant_access_tampering_raises_violation(self):
        """
        Attempting to fetch another tenant's entity ID directly must raise
        TenantAccessViolationError, distinguishing deliberate tampering from a 404.
        """
        with ContextEngine.run_as_tenant(company_id=self.company_b.id):
            prod_b = self.repo.create(sku="SKU-BETA-2", name="Beta Secret Item", slug="beta-secret")

        # Company A attempts to access Company B's product
        with ContextEngine.run_as_tenant(company_id=self.company_a.id):
            with pytest.raises(TenantAccessViolationError) as exc_info:
                self.repo.get_by_id(prod_b.id)
            self.assertIn("Security Alert: Attempted cross-tenant access", exc_info.value.message)

    def test_nonexistent_id_raises_standard_does_not_exist(self):
        """Nonexistent ID across all tenants raises standard Model.DoesNotExist."""
        with ContextEngine.run_as_tenant(company_id=self.company_a.id):
            with pytest.raises(Product.DoesNotExist):
                self.repo.get_by_id("prod_nonexistent_99999")

    def test_tenant_scoped_creation_prevents_company_spoofing(self):
        """Repository.create() must overwrite any caller-spoofed company_id."""
        with ContextEngine.run_as_tenant(company_id=self.company_a.id):
            # Caller attempts to spoof company_id to Company B
            prod = self.repo.create(
                sku="SKU-SPOOF-1",
                name="Spoofed Item",
                slug="spoofed-item",
                company_id=self.company_b.id,
            )
            # Must enforce active tenant (Company A)
            self.assertEqual(prod.company_id, self.company_a.id)

    def test_context_engine_restores_state_and_prevents_leaks(self):
        """Nested ContextEngine.run_as_tenant blocks must cleanly restore previous scope."""
        RequestContext._set_company_id(self.company_a.id)
        self.assertEqual(RequestContext.get_company_id(), self.company_a.id)

        with ContextEngine.run_as_tenant(company_id=self.company_b.id):
            self.assertEqual(RequestContext.get_company_id(), self.company_b.id)

        # Must restore to Company A
        self.assertEqual(RequestContext.get_company_id(), self.company_a.id)
