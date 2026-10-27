from decimal import Decimal

import pytest
from django.contrib.auth.models import Group
from rest_framework.test import APIRequestFactory, force_authenticate

from apps.customers.models.customer import Customer
from apps.customers.models.shopping import Wishlist, WishlistItem
from apps.shop.infrastructure.models.inventory import Inventory
from apps.shop.infrastructure.models.pricing import PriceList, PricingRule
from apps.shop.infrastructure.models.product import Product
from apps.shop.infrastructure.models.variant import ProductVariant
from apps.shop.interface.views.product_views import ProductViewSet
from apps.users.models.users import UserProfileModel
from core.admin.models.company import Company
from core.admin.utils.context import RequestContext
from tests.factories.user import UserFactory


@pytest.mark.django_db
class TestStorefrontThreeLayerArchitecture:
    def setup_method(self):
        self.factory = APIRequestFactory()
        self.company = Company.objects.create(name="Acme Global", code="ACME")
        RequestContext._set_company_id(str(self.company.id))

        # 1. Staff User with Catalog Manager Group
        self.staff_user = UserFactory(email="staff@example.com", is_staff=True)
        catalog_group, _ = Group.objects.get_or_create(name="Catalog Managers")
        self.staff_user.groups.add(catalog_group)
        UserProfileModel.objects.filter(user=self.staff_user).update(
            user_type="STAFF", company=self.company
        )

        # 2. Retail Customer (B2C)
        self.retail_user = UserFactory(email="retail@customer.com", is_staff=False)
        UserProfileModel.objects.filter(user=self.retail_user).update(
            user_type="CUSTOMER_B2C", company=self.company
        )
        self.retail_customer = Customer.objects.create(
            name="Retail Buyer",
            customer_code="CUST-RET-001",
            user=self.retail_user,
            customer_type="INDIVIDUAL",
            company=self.company,
        )

        # 3. Wholesale B2B Customer
        self.b2b_user = UserFactory(email="wholesale@buyer.com", is_staff=False)
        UserProfileModel.objects.filter(user=self.b2b_user).update(
            user_type="CUSTOMER_B2B", company=self.company
        )
        self.b2b_customer = Customer.objects.create(
            name="Wholesale Corp",
            customer_code="CUST-WHOLE-001",
            user=self.b2b_user,
            customer_type="COMMERCIAL",
            company=self.company,
            metadata={"customer_group": "Wholesale"},
        )
        self.staff_user.refresh_from_db()
        self.retail_user.refresh_from_db()
        self.b2b_user.refresh_from_db()

        # Products
        self.active_product = Product.objects.create(
            name="Enterprise Server",
            sku="SRV-001",
            price=Decimal("1000.00"),
            status="ACTIVE",
            is_active=True,
            metadata={"internal_notes": "Internal BOM cost $600"},
            extensions={"supplier": "Foxconn"},
            company=self.company,
        )
        self.variant = ProductVariant.objects.create(
            product=self.active_product,
            sku="SRV-001-BASE",
            price=Decimal("1000.00"),
            status="ACTIVE",
            is_active=True,
        )

        self.draft_product = Product.objects.create(
            name="Unreleased Prototype",
            sku="PROTO-999",
            price=Decimal("5000.00"),
            status="DRAFT",
            is_active=True,
            company=self.company,
        )

    def teardown_method(self):
        RequestContext.clear()

    # -------------------------------------------------------------------------
    # Test 1: Layer 1 Authorization & Layer 3 Data Protection (Field Masking)
    # -------------------------------------------------------------------------
    def test_field_masking_for_customer_vs_staff(self):
        view = ProductViewSet.as_view()

        # A. Retail Customer Request
        req_customer = self.factory.get(f"/api/v1/shop/products/{self.active_product.id}/")
        req_customer.session = {}
        force_authenticate(req_customer, user=self.retail_user)
        res_customer = view(req_customer, pk=self.active_product.id)

        assert res_customer.status_code == 200
        data_cust = res_customer.data["data"]

        # Sensitive internal fields MUST BE MASKED for customer
        assert "company" not in data_cust
        assert "metadata" not in data_cust
        assert "extensions" not in data_cust
        assert "status" not in data_cust

        # Storefront public & customer fields MUST BE PRESENT
        assert data_cust["name"] == "Enterprise Server"
        assert "stock_status" in data_cust
        assert "is_favorited" in data_cust

        # B. Staff User Request
        req_staff = self.factory.get(f"/api/v1/shop/products/{self.active_product.id}/")
        req_staff.session = {}
        force_authenticate(req_staff, user=self.staff_user)
        res_staff = view(req_staff, pk=self.active_product.id)

        assert res_staff.status_code == 200
        data_staff = res_staff.data["data"]

        # Staff CAN SEE internal fields
        assert "company" in data_staff
        assert "metadata" in data_staff
        assert "extensions" in data_staff
        assert "status" in data_staff
        assert data_staff["status"] == "ACTIVE"

    # -------------------------------------------------------------------------
    # Test 2: Layer 3 Queryset Protection (Inactive & Draft Products)
    # -------------------------------------------------------------------------
    def test_draft_product_hidden_from_customers(self):
        view = ProductViewSet.as_view()

        # Customer queries product list
        req_customer = self.factory.get("/api/v1/shop/products/")
        req_customer.session = {}
        force_authenticate(req_customer, user=self.retail_user)
        res_customer = view(req_customer)

        assert res_customer.status_code == 200
        items = res_customer.data.get("results") or res_customer.data.get("data")
        sku_list = [item["sku"] for item in items]

        # Customer only sees ACTIVE products, DRAFT is filtered out
        assert "SRV-001" in sku_list
        assert "PROTO-999" not in sku_list

        # Staff queries product list
        req_staff = self.factory.get("/api/v1/shop/products/")
        req_staff.session = {}
        force_authenticate(req_staff, user=self.staff_user)
        res_staff = view(req_staff)

        assert res_staff.status_code == 200
        staff_items = res_staff.data.get("results") or res_staff.data.get("data")
        staff_sku_list = [item["sku"] for item in staff_items]

        # Staff can see both ACTIVE and DRAFT products
        assert "SRV-001" in staff_sku_list
        assert "PROTO-999" in staff_sku_list

    # -------------------------------------------------------------------------
    # Test 3: Layer 2 Dynamic Commercial Tier Pricing (Wholesale vs Retail)
    # -------------------------------------------------------------------------
    def test_dynamic_b2b_wholesale_pricing(self):
        # Create Wholesale 20% discount rule
        plist = PriceList.objects.create(name="Wholesale Price List", code="PL-WHOLE")
        PricingRule.objects.create(
            name="20% Wholesale Contract",
            price_list=plist,
            variant=self.variant,
            customer_group="Wholesale",
            discount_percentage=Decimal("20.00"),
            min_quantity=1,
            is_active=True,
        )

        view = ProductViewSet.as_view()

        # A. Retail Customer -> List price ($1000.00)
        req_retail = self.factory.get(f"/api/v1/shop/products/{self.active_product.id}/")
        req_retail.session = {}
        force_authenticate(req_retail, user=self.retail_user)
        res_retail = view(req_retail, pk=self.active_product.id)
        assert res_retail.status_code == 200
        assert Decimal(res_retail.data["data"]["price"]) == Decimal("1000.00")
        assert Decimal(res_retail.data["data"]["variants"][0]["price"]) == Decimal("1000.00")

        # B. Wholesale B2B Customer -> Dynamic Contract price ($800.00)
        req_b2b = self.factory.get(f"/api/v1/shop/products/{self.active_product.id}/")
        req_b2b.session = {}
        force_authenticate(req_b2b, user=self.b2b_user)
        res_b2b = view(req_b2b, pk=self.active_product.id)
        assert res_b2b.status_code == 200
        b2b_data = res_b2b.data["data"]

        # Product & Variant prices reflect 20% discount
        assert Decimal(b2b_data["price"]) == Decimal("800.00")
        variant_data = b2b_data["variants"][0]
        assert Decimal(variant_data["price"]) == Decimal("800.00")
        assert Decimal(variant_data["base_price"]) == Decimal("1000.00")
        assert variant_data["applied_discount_percent"] == 20.0
        assert variant_data["applied_rule_name"] == "20% Wholesale Contract"

    # -------------------------------------------------------------------------
    # Test 4: Layer 3 Stock Messaging & Customer Wishlist Personalization
    # -------------------------------------------------------------------------
    def test_stock_messaging_and_wishlist_personalization(self):
        # Add 3 units of inventory -> Should produce 'ONLY_3_LEFT'
        Inventory.objects.create(
            variant=self.variant,
            quantity=3,
            reserved_quantity=0,
        )

        # Retail customer adds active_product to their Wishlist
        wishlist = Wishlist.objects.create(customer=self.retail_customer, name="My Wishlist")
        WishlistItem.objects.create(
            wishlist=wishlist,
            product=self.active_product,
            variant=self.variant,
        )

        view = ProductViewSet.as_view()

        # Retail customer checks active_product
        req_retail = self.factory.get(f"/api/v1/shop/products/{self.active_product.id}/")
        req_retail.session = {}
        force_authenticate(req_retail, user=self.retail_user)
        res_retail = view(req_retail, pk=self.active_product.id)

        data = res_retail.data["data"]
        assert data["stock_status"] == "ONLY_3_LEFT"
        assert data["is_favorited"] is True

        # B2B customer checks active_product (has NOT wishlisted it)
        req_b2b = self.factory.get(f"/api/v1/shop/products/{self.active_product.id}/")
        req_b2b.session = {}
        force_authenticate(req_b2b, user=self.b2b_user)
        res_b2b = view(req_b2b, pk=self.active_product.id)

        assert res_b2b.data["data"]["is_favorited"] is False
