# tests/security/test_context_policy_scoping.py
from dataclasses import FrozenInstanceError

import pytest
from django.test import TestCase

from apps.customers.policies.customer_cart_policy import CustomerCartPolicy
from apps.procurement_pos.models.procurement import Supplier
from apps.shop.infrastructure.models.product import Product
from apps.shop.policies.vendor_product_policy import VendorProductPolicy
from core.authorization.exceptions import AuthorizationDeniedError
from core.authorization.policy_engine import PolicyEngine
from core.authorization.registries import PolicyRegistry
from core.context.context_builder import ObjectContextBuilder
from core.context.context_manager import RequestContextManager
from core.context.object_context import ObjectContext
from core.context.request_context import RequestContext
from core.repositories.scoped_repository import StrategyScopedRepository
from core.security.tenant_isolation.exceptions import TenantAccessViolationError
from tests.base import BaseTest
from tests.factories.company import CompanyFactory
from tests.factories.user import UserFactory


class TestContextPolicyScopingArchitecture(BaseTest, TestCase):
    """
    Automated Architecture & Security Test Suite for Decoupled Core:
    Verifies RequestContext vs ObjectContext separation, PolicyEngine evaluation,
    Customer multi-tenancy bypass, and StrategyScopedRepository data boundaries.
    """

    def setUp(self):
        super().setUp()
        RequestContextManager.clear()
        self.company_1 = CompanyFactory.create(name="Vendor Co 1", code="VND1")
        self.company_2 = CompanyFactory.create(name="Vendor Co 2", code="VND2")

        # Explicit Supplier creation
        self.supplier_1 = Supplier.objects.create(name="Supplier One", code="SUP-001")
        self.supplier_2 = Supplier.objects.create(name="Supplier Two", code="SUP-002")

        self.user_shopper = UserFactory.create(username="shopper_jane", email="jane@shopper.test")
        self.user_vendor = UserFactory.create(username="vendor_bob", email="bob@vendor.test")

        # Re-register test policies cleanly
        PolicyRegistry.register("product", "VENDOR", VendorProductPolicy)
        PolicyRegistry.register("product", None, VendorProductPolicy)
        PolicyRegistry.register("cart", "CUSTOMER", CustomerCartPolicy)
        PolicyRegistry.register("cart", None, CustomerCartPolicy)

    def tearDown(self):
        RequestContextManager.clear()
        super().tearDown()

    def test_request_context_immutability(self):
        """RequestContext is an immutable value object; runtime mutations must raise an error."""
        ctx = RequestContext(user_id="usr_123", persona="CUSTOMER")
        with pytest.raises(FrozenInstanceError):
            ctx.persona = "VENDOR"

    def test_object_context_builder_extraction(self):
        """ObjectContextBuilder extracts verified server-side attributes from trusted models."""
        product = Product.objects.create(
            sku="SKU-PROD-99",
            name="Mechanical Keyboard",
            slug="mech-keyboard",
            company_id=self.company_1.id,
            is_active=True,
        )
        obj_ctx = ObjectContextBuilder.from_object(product)

        self.assertEqual(obj_ctx.resource_type, "product")
        self.assertEqual(obj_ctx.resource_id, str(product.id))
        self.assertEqual(obj_ctx.company_id, str(self.company_1.id))
        self.assertTrue(obj_ctx.is_public)

    def test_policy_engine_authorizes_matching_vendor_and_denies_mismatch(self):
        """Vendor can update their own products, but is denied on another vendor's products."""
        vendor_ctx = RequestContext(
            user_id=str(self.user_vendor.id),
            persona="VENDOR",
            supplier_id=str(self.supplier_1.id),
            company_id=str(self.company_1.id),
        )

        own_product_ctx = ObjectContext(
            resource_type="product",
            resource_id="prod_01",
            supplier_id=str(self.supplier_1.id),
            company_id=str(self.company_1.id),
        )

        other_vendor_product_ctx = ObjectContext(
            resource_type="product",
            resource_id="prod_02",
            supplier_id=str(self.supplier_2.id),
            company_id=str(self.company_2.id),
        )

        # 1. Vendor can update own product
        self.assertTrue(PolicyEngine.evaluate("update", vendor_ctx, own_product_ctx))
        PolicyEngine.authorize("update", vendor_ctx, own_product_ctx)

        # 2. Vendor is denied on another vendor's product
        self.assertFalse(PolicyEngine.evaluate("update", vendor_ctx, other_vendor_product_ctx))
        with pytest.raises(AuthorizationDeniedError):
            PolicyEngine.authorize("update", vendor_ctx, other_vendor_product_ctx)

    def test_policy_engine_denies_customer_from_updating_products(self):
        """Shopper persona cannot mutate products even if public."""
        customer_ctx = RequestContext(
            user_id=str(self.user_shopper.id),
            persona="CUSTOMER",
        )
        product_ctx = ObjectContext(
            resource_type="product",
            resource_id="prod_01",
            company_id=str(self.company_1.id),
            is_public=True,
        )

        # Customer can read public product
        self.assertTrue(PolicyEngine.evaluate("read", customer_ctx, product_ctx))

        # Customer is denied product update
        self.assertFalse(PolicyEngine.evaluate("update", customer_ctx, product_ctx))
        with pytest.raises(AuthorizationDeniedError):
            PolicyEngine.authorize("update", customer_ctx, product_ctx)

    def test_customer_cart_policy_bypasses_company_and_enforces_ownership(self):
        """Customer Cart authorization is strictly user-ownership scoped, completely bypassing company_id."""
        customer_jane_ctx = RequestContext(
            user_id=str(self.user_shopper.id),
            persona="CUSTOMER",
            company_id=None,  # No B2B Company!
        )

        jane_cart_ctx = ObjectContext(
            resource_type="cart",
            resource_id="cart_jane_01",
            owner_id=str(self.user_shopper.id),
            company_id=None,
        )

        another_user = UserFactory.create(username="stranger", email="stranger@test.com")
        stranger_cart_ctx = ObjectContext(
            resource_type="cart",
            resource_id="cart_stranger_02",
            owner_id=str(another_user.id),
            company_id=None,
        )

        # Jane can read/update her own cart without company context
        self.assertTrue(PolicyEngine.evaluate("update", customer_jane_ctx, jane_cart_ctx))

        # Jane cannot touch stranger's cart
        self.assertFalse(PolicyEngine.evaluate("update", customer_jane_ctx, stranger_cart_ctx))
        with pytest.raises(AuthorizationDeniedError):
            PolicyEngine.authorize("update", customer_jane_ctx, stranger_cart_ctx)

    def test_strategy_scoped_repository_customer_public_catalog_browsing(self):
        """
        Customer persona using StrategyScopedRepository(Product) automatically applies
        PublicCatalogStrategy, returning active products without needing company_id.
        """
        Product.objects.create(
            sku="SKU-ACTIVE-1",
            name="Public Headphones",
            slug="public-headphones",
            company_id=self.company_1.id,
            is_active=True,
        )
        Product.objects.create(
            sku="SKU-INACTIVE-1",
            name="Draft Product",
            slug="draft-product",
            company_id=self.company_1.id,
            is_active=False,
        )

        customer_ctx = RequestContext(
            user_id=str(self.user_shopper.id),
            persona="CUSTOMER",
            company_id=None,  # Bypassed!
        )

        repo = StrategyScopedRepository(Product)
        qs = repo.get_queryset(customer_ctx)

        # Only active products returned, zero company_id error thrown
        self.assertEqual(qs.count(), 1)
        self.assertEqual(qs.first().sku, "SKU-ACTIVE-1")

    def test_strategy_scoped_repository_vendor_isolation(self):
        """
        Vendor persona using StrategyScopedRepository(Product) automatically applies
        VendorSupplierStrategy, filtering strictly to the vendor's company.
        """
        p1 = Product.objects.create(
            sku="SKU-VND1-P",
            name="Vendor 1 Watch",
            slug="vendor-1-watch",
            company_id=self.company_1.id,
            is_active=True,
        )
        p2 = Product.objects.create(
            sku="SKU-VND2-P",
            name="Vendor 2 Shoes",
            slug="vendor-2-shoes",
            company_id=self.company_2.id,
            is_active=True,
        )

        vendor_1_ctx = RequestContext(
            user_id=str(self.user_vendor.id),
            persona="VENDOR",
            company_id=str(self.company_1.id),
        )

        repo = StrategyScopedRepository(Product)
        qs = repo.get_queryset(vendor_1_ctx)

        # Vendor 1 only sees their product
        self.assertEqual(qs.count(), 1)
        self.assertEqual(qs.first().id, p1.id)

        # Vendor 1 attempting to fetch Vendor 2 product raises TenantAccessViolationError
        with pytest.raises(TenantAccessViolationError):
            repo.get_by_id(p2.id, context=vendor_1_ctx)
